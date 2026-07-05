import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, parseAbi, parseAbiItem, type Log } from "viem";
import { arbitrumSepolia } from "viem/chains";
import { ADDRESSES } from "@/packages/dex-config";

// Server-side analytics aggregator. The deployed v3 subgraph is an event stub
// (only PoolCreated entities), so protocol metrics are assembled here instead:
// pool discovery from the stub, prices/TVL from on-chain reads, and volume /
// swap history from raw Swap logs. The client hooks in lib/subgraph.ts consume
// this route; nothing here reaches the browser except the aggregated numbers.

export const dynamic = "force-dynamic";

const V3_START_BLOCK = 280_307_048n;
const FEE_DENOM = 1_000_000;

const client = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(process.env.RPC_URL || "http://localhost:8545"),
});

// Alchemy's free tier caps eth_getLogs at a 10-block range, so historical log
// sweeps go through the official public endpoint (which accepts full ranges).
const logClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(process.env.RPC_LOGS_URL || "https://sepolia-rollup.arbitrum.io/rpc"),
});

const erc20Abi = parseAbi([
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
]);
const slot0Abi = parseAbi([
  "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16, uint16, uint16, uint8, bool)",
]);
const swapEvent = parseAbiItem(
  "event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)",
);
const mintEvent = parseAbiItem(
  "event Mint(address sender, address indexed owner, int24 indexed tickLower, int24 indexed tickUpper, uint128 amount, uint256 amount0, uint256 amount1)",
);
const burnEvent = parseAbiItem(
  "event Burn(address indexed owner, int24 indexed tickLower, int24 indexed tickUpper, uint128 amount, uint256 amount0, uint256 amount1)",
);

type StubPool = { token0: string; token1: string; fee: string; pool: string };

type PoolData = {
  id: string;
  token0: string;
  token1: string;
  addr0: string;
  addr1: string;
  dec0: number;
  dec1: number;
  feeTier: number;
  tvlUSD: number;
  volumeUSD: number;
  /** token1 per token0, human units */
  price: number;
};

type SwapItem = {
  id: string;
  txId: string;
  timestamp: number;
  amount0: number;
  amount1: number;
  amountUSD: number;
  token0: string;
  token1: string;
  origin: string;
};

type ActivityItem = SwapItem & { type: "swap" | "add" | "remove" };

type Snapshot = {
  metrics: { totalValueLockedUSD: number; volumeUSD: number; feesUSD: number; poolCount: number };
  pools: PoolData[];
  dayHistory: { date: number; tvlUSD: number; volumeUSD: number }[];
  recentSwaps: SwapItem[];
  /** lowercased token address -> USD price */
  prices: Record<string, number>;
  activity: ActivityItem[];
};

// One in-flight computation + a short cache so a page full of widgets doesn't
// fan out into dozens of identical RPC sweeps.
let cache: { at: number; data: Snapshot } | undefined;
let pending: Promise<Snapshot> | undefined;
const TTL_MS = 30_000;

async function fetchStubPools(): Promise<StubPool[]> {
  const url = process.env.SUBGRAPH_URL_V3;
  if (!url) return [];
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.SUBGRAPH_BEARER_TOKEN) headers.Authorization = `Bearer ${process.env.SUBGRAPH_BEARER_TOKEN}`;
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ query: "{ poolCreateds(first: 100) { token0 token1 fee pool } }" }),
  });
  const json = await res.json();
  return json.data?.poolCreateds ?? [];
}

async function getEventLogs<const TEvent extends typeof swapEvent | typeof mintEvent | typeof burnEvent>(
  address: `0x${string}`[],
  event: TEvent,
) {
  try {
    return await logClient.getLogs({ address, event, fromBlock: V3_START_BLOCK, toBlock: "latest" });
  } catch {
    // Some RPC plans cap the block span per eth_getLogs call - sweep in chunks.
    const latest = await logClient.getBlockNumber();
    const out: Awaited<ReturnType<typeof client.getLogs<TEvent>>> = [];
    const STEP = 450_000n;
    for (let from = V3_START_BLOCK; from <= latest; from += STEP) {
      const to = from + STEP - 1n > latest ? latest : from + STEP - 1n;
      out.push(...(await logClient.getLogs({ address, event, fromBlock: from, toBlock: to })));
    }
    return out;
  }
}

const sqrtToPrice = (sqrtPriceX96: bigint, dec0: number, dec1: number) => {
  const ratio = (Number(sqrtPriceX96) / 2 ** 96) ** 2; // raw token1 per raw token0
  return ratio * 10 ** (dec0 - dec1);
};

async function build(): Promise<Snapshot> {
  const stubPools = await fetchStubPools();
  const poolAddrs = stubPools.map((p) => p.pool as `0x${string}`);

  // Token metadata, pool balances (TVL), and current prices in one multicall.
  const meta = await client.multicall({
    contracts: stubPools.flatMap((p) => [
      { address: p.token0 as `0x${string}`, abi: erc20Abi, functionName: "symbol" as const },
      { address: p.token0 as `0x${string}`, abi: erc20Abi, functionName: "decimals" as const },
      { address: p.token1 as `0x${string}`, abi: erc20Abi, functionName: "symbol" as const },
      { address: p.token1 as `0x${string}`, abi: erc20Abi, functionName: "decimals" as const },
      { address: p.token0 as `0x${string}`, abi: erc20Abi, functionName: "balanceOf" as const, args: [p.pool as `0x${string}`] },
      { address: p.token1 as `0x${string}`, abi: erc20Abi, functionName: "balanceOf" as const, args: [p.pool as `0x${string}`] },
      { address: p.pool as `0x${string}`, abi: slot0Abi, functionName: "slot0" as const },
    ]),
    allowFailure: true,
  });

  const pools: PoolData[] = stubPools.map((p, i) => {
    const b = i * 7;
    const dec0 = Number(meta[b + 1]?.result ?? 18);
    const dec1 = Number(meta[b + 3]?.result ?? 18);
    const slot = meta[b + 6]?.result as readonly unknown[] | undefined;
    return {
      id: p.pool.toLowerCase(),
      token0: (meta[b]?.result as string) ?? "?",
      token1: (meta[b + 2]?.result as string) ?? "?",
      addr0: p.token0.toLowerCase(),
      addr1: p.token1.toLowerCase(),
      dec0,
      dec1,
      feeTier: Number(p.fee),
      tvlUSD: 0,
      volumeUSD: 0,
      price: slot ? sqrtToPrice(slot[0] as bigint, dec0, dec1) : 0,
      // balances stashed below once USD prices are known
      _bal0: Number((meta[b + 4]?.result as bigint) ?? 0n) / 10 ** dec0,
      _bal1: Number((meta[b + 5]?.result as bigint) ?? 0n) / 10 ** dec1,
    } as PoolData & { _bal0: number; _bal1: number };
  });

  // USD prices: the test stables anchor the system at $1; WETH from the
  // tUSDC/WETH pool; every other token from its WETH pair.
  const weth = ADDRESSES.weth9.toLowerCase();
  const prices: Record<string, number> = {
    [ADDRESSES.tUSDC.toLowerCase()]: 1,
    [ADDRESSES.tDAI.toLowerCase()]: 1,
  };
  const stablePool = pools.find(
    (p) => (p.addr0 === ADDRESSES.tUSDC.toLowerCase() && p.addr1 === weth) || (p.addr1 === ADDRESSES.tUSDC.toLowerCase() && p.addr0 === weth),
  );
  if (stablePool && stablePool.price > 0) {
    // price = token1 per token0 (human). Whichever side WETH is on, USD/WETH follows.
    prices[weth] = stablePool.addr1 === weth ? 1 / stablePool.price : stablePool.price;
  }
  for (const p of pools) {
    if (p.addr0 === weth && !(p.addr1 in prices) && p.price > 0) prices[p.addr1] = prices[weth] / p.price || 0;
    if (p.addr1 === weth && !(p.addr0 in prices) && p.price > 0) prices[p.addr0] = p.price * (prices[weth] ?? 0);
  }

  for (const p of pools as (PoolData & { _bal0: number; _bal1: number })[]) {
    p.tvlUSD = p._bal0 * (prices[p.addr0] ?? 0) + p._bal1 * (prices[p.addr1] ?? 0);
  }

  // Swap/Mint/Burn logs over the pools' lifetime.
  const [swapLogs, mintLogs, burnLogs] = await Promise.all([
    getEventLogs(poolAddrs, swapEvent),
    getEventLogs(poolAddrs, mintEvent),
    getEventLogs(poolAddrs, burnEvent),
  ]);

  // Timestamps + originating EOAs for the (small) set of involved blocks/txs.
  const allLogs = [...swapLogs, ...mintLogs, ...burnLogs];
  const blockNums = [...new Set(allLogs.map((l) => l.blockNumber!))];
  const blockTs = new Map<bigint, number>();
  await Promise.all(
    blockNums.map(async (bn) => {
      const blk = await logClient.getBlock({ blockNumber: bn });
      blockTs.set(bn, Number(blk.timestamp));
    }),
  );
  const txHashes = [...new Set(allLogs.map((l) => l.transactionHash!))];
  const txFrom = new Map<string, string>();
  await Promise.all(
    txHashes.map(async (h) => {
      const tx = await logClient.getTransaction({ hash: h });
      txFrom.set(h, tx.from.toLowerCase());
    }),
  );

  const poolById = new Map(pools.map((p) => [p.id, p]));

  const toItem = (log: Log, a0: bigint, a1: bigint): SwapItem => {
    const pool = poolById.get(log.address.toLowerCase())!;
    const amount0 = Number(a0) / 10 ** pool.dec0;
    const amount1 = Number(a1) / 10 ** pool.dec1;
    return {
      id: `${log.transactionHash}#${log.logIndex}`,
      txId: log.transactionHash!,
      timestamp: blockTs.get(log.blockNumber!) ?? 0,
      amount0,
      amount1,
      amountUSD: Math.abs(amount0) * (prices[pool.addr0] ?? 0),
      token0: pool.token0,
      token1: pool.token1,
      origin: txFrom.get(log.transactionHash!) ?? "",
    };
  };

  const swaps = swapLogs.map((l) => toItem(l, l.args.amount0!, l.args.amount1!));
  swapLogs.forEach((l, i) => {
    const pool = poolById.get(l.address.toLowerCase());
    if (pool) pool.volumeUSD += swaps[i].amountUSD;
  });

  const totalVolume = pools.reduce((s, p) => s + p.volumeUSD, 0);
  const totalTvl = pools.reduce((s, p) => s + p.tvlUSD, 0);
  const feesUSD = pools.reduce((s, p) => s + (p.volumeUSD * p.feeTier) / FEE_DENOM, 0);

  // Per-day volume; TVL is reported at its current value for every day since
  // per-day historical TVL isn't reconstructable without an archive sweep.
  const byDay = new Map<number, number>();
  for (const s of swaps) {
    const day = Math.floor(s.timestamp / 86_400) * 86_400;
    byDay.set(day, (byDay.get(day) ?? 0) + s.amountUSD);
  }
  const today = Math.floor(Date.now() / 1000 / 86_400) * 86_400;
  const firstDay = byDay.size ? Math.min(...byDay.keys()) : today;
  const dayHistory: Snapshot["dayHistory"] = [];
  for (let d = firstDay; d <= today; d += 86_400) {
    dayHistory.push({ date: d, tvlUSD: totalTvl, volumeUSD: byDay.get(d) ?? 0 });
  }

  const activity: ActivityItem[] = [
    ...swaps.map((s) => ({ ...s, type: "swap" as const })),
    ...mintLogs.map((l) => ({ ...toItem(l, l.args.amount0!, l.args.amount1!), type: "add" as const })),
    ...burnLogs.map((l) => ({ ...toItem(l, l.args.amount0!, l.args.amount1!), type: "remove" as const })),
  ].sort((a, b) => b.timestamp - a.timestamp);

  return {
    metrics: { totalValueLockedUSD: totalTvl, volumeUSD: totalVolume, feesUSD, poolCount: pools.length },
    pools: pools
      .map(({ ...p }) => {
        delete (p as Record<string, unknown>)._bal0;
        delete (p as Record<string, unknown>)._bal1;
        return p;
      })
      .sort((a, b) => b.tvlUSD - a.tvlUSD),
    dayHistory,
    recentSwaps: swaps.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10),
    prices,
    activity: activity.slice(0, 200),
  };
}

export async function GET(req: NextRequest) {
  try {
    if (!cache || Date.now() - cache.at > TTL_MS) {
      pending ??= build().finally(() => (pending = undefined));
      cache = { at: Date.now(), data: await pending };
    }
    const data = cache.data;
    const user = req.nextUrl.searchParams.get("user")?.toLowerCase();
    return NextResponse.json({
      ...data,
      activity: user ? data.activity.filter((a) => a.origin === user).slice(0, 12) : undefined,
    });
  } catch (e) {
    console.error("[analytics] failed:", e);
    return NextResponse.json({ error: "analytics unavailable" }, { status: 502 });
  }
}
