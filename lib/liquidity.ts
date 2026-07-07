"use client";

// Adapter that isolates all V3 concentrated-liquidity reads/writes behind hooks,
// mirroring lib/staking.ts. Components never touch ABIs or the v3-sdk math
// directly - they call usePositions / usePool / useLiquidityActions.
//
//   reads : usePositions()  -> all LP NFTs owned by the wallet, enriched with
//                              current pool price + in/out-of-range status
//           usePool(a,b,fee) -> a live v3-sdk Pool built from slot0 + liquidity
//   writes: useLiquidityActions() -> add / increase / remove / collect, with the
//           NonfungiblePositionManager calldata built by the v3-sdk helper and
//           sent to the position manager via writeContract.
//
// The V3 subgraph has no Position entity, so positions are enumerated on-chain
// (balanceOf -> tokenOfOwnerByIndex -> positions) per the SRS gap note.

import { useEffect, useMemo } from "react";
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useSendTransaction,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { Token, Percent, CurrencyAmount } from "@uniswap/sdk-core";
import {
  Pool,
  Position,
  FeeAmount,
  TickMath,
  TICK_SPACINGS,
  nearestUsableTick,
  tickToPrice,
  NonfungiblePositionManager,
} from "@uniswap/v3-sdk";
import JSBI from "jsbi";
import {
  erc20Abi,
  positionManagerAbi,
  v3FactoryAbi,
  v3PoolAbi,
} from "./contracts";
import { DEX, DEX_CHAIN } from "./dex";

// ── Types ────────────────────────────────────────────────────────────────────

/** Raw on-chain position record from NonfungiblePositionManager.positions(). */
type RawPosition = {
  token0: `0x${string}`;
  token1: `0x${string}`;
  fee: number;
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
  tokensOwed0: bigint;
  tokensOwed1: bigint;
};

export type PositionInfo = {
  tokenId: bigint;
  token0: `0x${string}`;
  token1: `0x${string}`;
  symbol0: string;
  symbol1: string;
  fee: FeeAmount;
  tickLower: number;
  tickUpper: number;
  /** Lower/upper price bounds quoted as token1 per token0. */
  priceLower: string;
  priceUpper: string;
  /** Current pool price, same quote. */
  priceCurrent: string;
  inRange: boolean;
  closed: boolean;
  /** Token amounts the position currently holds. */
  amount0: number;
  amount1: number;
  /** Unclaimed fees (as last poked on-chain). */
  fees0: number;
  fees1: number;
  /** SDK objects for building increase/remove/collect calldata. */
  sdk: { position: Position; owed0: bigint; owed1: bigint };
};

const FEE_TIERS: FeeAmount[] = [FeeAmount.LOWEST, FeeAmount.LOW, FeeAmount.MEDIUM, FeeAmount.HIGH];

/**
 * The real, on-chain tokens available for liquidity on the deployment. Address +
 * decimals come from the config so the SDK Token objects are exact. (The mock
 * TOKENS list in lib/tokens.ts is for the not-yet-wired swap demo only.)
 */
export const DEX_TOKENS: Token[] = [
  new Token(DEX_CHAIN.id, DEX.PGX, 18, "PGX", "PrigeeX"),
  new Token(DEX_CHAIN.id, DEX.weth9, 18, "WETH", "Wrapped Ether"),
  new Token(DEX_CHAIN.id, DEX.tUSDC, 6, "tUSDC", "Test USD Coin"),
  new Token(DEX_CHAIN.id, DEX.tDAI, 18, "tDAI", "Test Dai"),
];

export const tokenByAddress = (a: string) =>
  DEX_TOKENS.find((t) => t.address.toLowerCase() === a.toLowerCase());

/** Convert a human price (token1 per token0) to the nearest usable tick. */
export function priceToTick(price: number, t0: Token, t1: Token, fee: FeeAmount): number {
  const adjusted = price * 10 ** (t1.decimals - t0.decimals);
  const tick = Math.log(adjusted) / Math.log(1.0001);
  return nearestUsableTick(Math.round(tick), TICK_SPACINGS[fee]);
}

/** Inverse of priceToTick - tick to a human price (token1 per token0). */
export function tickToPriceNum(tick: number, t0: Token, t1: Token): number {
  return 1.0001 ** tick / 10 ** (t1.decimals - t0.decimals);
}

const jsbi = (v: bigint) => JSBI.BigInt(v.toString());
const toNum = (v: bigint, decimals: number) =>
  Number(v) / 10 ** decimals;

// ── Position list (FE-19) ────────────────────────────────────────────────────

export function usePositions() {
  const { address } = useAccount();

  // 1. How many LP NFTs does the wallet hold?
  const { data: balance } = useReadContract({
    address: DEX.positionManager,
    abi: positionManagerAbi,
    functionName: "balanceOf",
    args: [address!],
    query: { enabled: Boolean(address), refetchInterval: 15_000 },
  });

  const count = balance ? Number(balance) : 0;

  // 2. Resolve each index to a tokenId.
  const { data: tokenIdData } = useReadContracts({
    contracts: Array.from({ length: count }, (_, i) => ({
      address: DEX.positionManager,
      abi: positionManagerAbi,
      functionName: "tokenOfOwnerByIndex" as const,
      args: [address!, BigInt(i)] as const,
    })),
    query: { enabled: count > 0 },
  });

  const tokenIds = useMemo(
    () =>
      (tokenIdData ?? [])
        .filter((r) => r.status === "success")
        .map((r) => r.result as bigint),
    [tokenIdData],
  );

  // 3. Read each position's full record.
  const { data: posData, refetch, status } = useReadContracts({
    contracts: tokenIds.map((id) => ({
      address: DEX.positionManager,
      abi: positionManagerAbi,
      functionName: "positions" as const,
      args: [id] as const,
    })),
    query: { enabled: tokenIds.length > 0, refetchInterval: 15_000 },
  });

  const raw = useMemo<{ id: bigint; pos: RawPosition }[]>(() => {
    if (!posData) return [];
    return posData
      .map((r, i) => {
        if (r.status !== "success") return null;
        const p = r.result as readonly unknown[];
        return {
          id: tokenIds[i],
          pos: {
            token0: p[2] as `0x${string}`,
            token1: p[3] as `0x${string}`,
            fee: Number(p[4]),
            tickLower: Number(p[5]),
            tickUpper: Number(p[6]),
            liquidity: p[7] as bigint,
            tokensOwed0: p[10] as bigint,
            tokensOwed1: p[11] as bigint,
          },
        };
      })
      .filter((x): x is { id: bigint; pos: RawPosition } => x !== null);
  }, [posData, tokenIds]);

  // 4. For each position read its pool (slot0/liquidity) + token metadata so we
  //    can compute price, range status and token amounts.
  const poolReads = raw.flatMap(({ pos }) => [
    { address: DEX.v3Factory, abi: v3FactoryAbi, functionName: "getPool" as const, args: [pos.token0, pos.token1, pos.fee] as const },
    { address: pos.token0, abi: erc20Abi, functionName: "symbol" as const },
    { address: pos.token0, abi: erc20Abi, functionName: "decimals" as const },
    { address: pos.token1, abi: erc20Abi, functionName: "symbol" as const },
    { address: pos.token1, abi: erc20Abi, functionName: "decimals" as const },
  ]);

  const { data: poolMeta } = useReadContracts({
    contracts: poolReads,
    query: { enabled: raw.length > 0 },
  });

  // 5. Read slot0 + liquidity for the resolved pool addresses.
  const poolAddrs = useMemo(() => {
    if (!poolMeta) return [];
    return raw.map((_, i) => {
      const r = poolMeta[i * 5];
      return r?.status === "success" ? (r.result as `0x${string}`) : undefined;
    });
  }, [poolMeta, raw]);

  const { data: slotData } = useReadContracts({
    contracts: poolAddrs.flatMap((addr) =>
      addr
        ? [
            { address: addr, abi: v3PoolAbi, functionName: "slot0" as const },
            { address: addr, abi: v3PoolAbi, functionName: "liquidity" as const },
          ]
        : [],
    ),
    query: { enabled: poolAddrs.some(Boolean) },
  });

  const positions = useMemo<PositionInfo[]>(() => {
    if (!poolMeta || !slotData) return [];
    const out: PositionInfo[] = [];
    let slotCursor = 0;
    raw.forEach(({ id, pos }, i) => {
      const base = i * 5;
      const symbol0 = (poolMeta[base + 1]?.result as string) ?? "?";
      const dec0 = Number(poolMeta[base + 2]?.result ?? 18);
      const symbol1 = (poolMeta[base + 3]?.result as string) ?? "?";
      const dec1 = Number(poolMeta[base + 4]?.result ?? 18);
      const hasPool = Boolean(poolAddrs[i]);
      const slot0 = hasPool ? slotData[slotCursor] : undefined;
      const liq = hasPool ? slotData[slotCursor + 1] : undefined;
      if (hasPool) slotCursor += 2;
      if (!slot0 || slot0.status !== "success" || !liq || liq.status !== "success") return;

      const slot = slot0.result as readonly unknown[];
      const sqrtPriceX96 = slot[0] as bigint;
      const tickCurrent = Number(slot[1]);

      const t0 = new Token(DEX_CHAIN.id, pos.token0, dec0, symbol0);
      const t1 = new Token(DEX_CHAIN.id, pos.token1, dec1, symbol1);
      const pool = new Pool(
        t0,
        t1,
        pos.fee as FeeAmount,
        sqrtPriceX96.toString(),
        (liq.result as bigint).toString(),
        tickCurrent,
      );
      const position = new Position({
        pool,
        liquidity: jsbi(pos.liquidity),
        tickLower: pos.tickLower,
        tickUpper: pos.tickUpper,
      });

      const fmt = (t: ReturnType<typeof tickToPrice>) =>
        t.toSignificant(6);

      // Full-range bounds read as "0 - ∞", not a 40-digit decimal expansion.
      const spacing = TICK_SPACINGS[pos.fee as FeeAmount];
      const atMin = pos.tickLower <= nearestUsableTick(TickMath.MIN_TICK, spacing);
      const atMax = pos.tickUpper >= nearestUsableTick(TickMath.MAX_TICK, spacing);

      out.push({
        tokenId: id,
        token0: pos.token0,
        token1: pos.token1,
        symbol0,
        symbol1,
        fee: pos.fee as FeeAmount,
        tickLower: pos.tickLower,
        tickUpper: pos.tickUpper,
        priceLower: atMin ? "0" : fmt(tickToPrice(t0, t1, pos.tickLower)),
        priceUpper: atMax ? "∞" : fmt(tickToPrice(t0, t1, pos.tickUpper)),
        priceCurrent: pool.token0Price.toSignificant(6),
        inRange: tickCurrent >= pos.tickLower && tickCurrent < pos.tickUpper,
        closed: pos.liquidity === 0n,
        amount0: Number(position.amount0.toSignificant(8)),
        amount1: Number(position.amount1.toSignificant(8)),
        fees0: toNum(pos.tokensOwed0, dec0),
        fees1: toNum(pos.tokensOwed1, dec1),
        sdk: { position, owed0: pos.tokensOwed0, owed1: pos.tokensOwed1 },
      });
    });
    return out;
  }, [poolMeta, slotData, raw, poolAddrs]);

  const loading = Boolean(address) && count > 0 && status === "pending";

  return { positions, count, loading, refetch };
}

// ── Single pool (for the add-liquidity range chart) ──────────────────────────

export function usePool(
  token0?: Token,
  token1?: Token,
  fee: FeeAmount = FeeAmount.MEDIUM,
) {
  const ready = Boolean(token0 && token1);

  const { data: poolAddr } = useReadContract({
    address: DEX.v3Factory,
    abi: v3FactoryAbi,
    functionName: "getPool",
    args: ready ? [token0!.address as `0x${string}`, token1!.address as `0x${string}`, fee] : undefined,
    query: { enabled: ready },
  });

  const exists = Boolean(poolAddr && poolAddr !== "0x0000000000000000000000000000000000000000");

  const { data } = useReadContracts({
    contracts: exists
      ? [
          { address: poolAddr!, abi: v3PoolAbi, functionName: "slot0" as const },
          { address: poolAddr!, abi: v3PoolAbi, functionName: "liquidity" as const },
        ]
      : [],
    query: { enabled: exists, refetchInterval: 12_000 },
  });

  const pool = useMemo(() => {
    if (!token0 || !token1 || !data || data[0]?.status !== "success" || data[1]?.status !== "success")
      return undefined;
    const slot = data[0].result as readonly unknown[];
    return new Pool(
      token0,
      token1,
      fee,
      (slot[0] as bigint).toString(),
      (data[1].result as bigint).toString(),
      Number(slot[1]),
    );
  }, [token0, token1, fee, data]);

  return { pool, poolAddress: poolAddr as `0x${string}` | undefined, exists };
}

// ── Writes (add / increase / remove / collect) ───────────────────────────────

type Cb = { onSuccess?: () => void; onError?: (e: Error) => void };

/**
 * Thin write layer. The v3-sdk helper returns ready calldata (already wrapped in
 * the position manager's multicall), so we just forward it via sendTransaction.
 * ERC-20 approvals to the position manager go through writeContract.
 */
export function useLiquidityActions(onMined?: () => void) {
  const { address } = useAccount();
  const { writeContract, sendTransaction, data: txHash, isPending, reset } = useWriteContractAndSend();
  const { isLoading: mining, isSuccess: mined } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (mined) {
      // Reset before onMined: the callback may (via the tx queue) synchronously
      // fire the next writeContract call, and resetting after that would detach
      // tracking from the new tx instead of the one that just mined.
      reset();
      onMined?.();
    }
  }, [mined, onMined, reset]);

  const busy = isPending || mining;

  const approve = (token: `0x${string}`, amount: bigint, cb?: Cb) =>
    writeContract(
      { address: token, abi: erc20Abi, functionName: "approve", args: [DEX.positionManager, amount] },
      cb,
    );

  const deadline = () => Math.floor(Date.now() / 1000) + 30 * 60;

  /** Mint a brand-new position (FE-16). */
  const mint = (position: Position, slippagePct: number, cb?: Cb) => {
    if (!address) return;
    const { calldata, value } = NonfungiblePositionManager.addCallParameters(position, {
      recipient: address,
      deadline: deadline(),
      slippageTolerance: new Percent(Math.round(slippagePct * 100), 10_000),
      createPool: false,
    });
    sendTransaction({ to: DEX.positionManager, data: calldata as `0x${string}`, value: BigInt(value) }, cb);
  };

  /** Add to an existing position (FE-20). */
  const increase = (position: Position, tokenId: bigint, slippagePct: number, cb?: Cb) => {
    const { calldata, value } = NonfungiblePositionManager.addCallParameters(position, {
      tokenId: tokenId.toString(),
      deadline: deadline(),
      slippageTolerance: new Percent(Math.round(slippagePct * 100), 10_000),
    });
    sendTransaction({ to: DEX.positionManager, data: calldata as `0x${string}`, value: BigInt(value) }, cb);
  };

  /** Remove a fraction (0-1) of liquidity and collect (FE-21). */
  const remove = (
    position: Position,
    tokenId: bigint,
    fraction: number,
    slippagePct: number,
    cb?: Cb,
  ) => {
    if (!address) return;
    const { calldata, value } = NonfungiblePositionManager.removeCallParameters(position, {
      tokenId: tokenId.toString(),
      liquidityPercentage: new Percent(Math.round(fraction * 10_000), 10_000),
      slippageTolerance: new Percent(Math.round(slippagePct * 100), 10_000),
      deadline: deadline(),
      burnToken: fraction >= 1,
      collectOptions: {
        expectedCurrencyOwed0: CurrencyAmount.fromRawAmount(position.pool.token0, 0),
        expectedCurrencyOwed1: CurrencyAmount.fromRawAmount(position.pool.token1, 0),
        recipient: address,
      },
    });
    sendTransaction({ to: DEX.positionManager, data: calldata as `0x${string}`, value: BigInt(value) }, cb);
  };

  /** Collect accrued fees only (FE-22). */
  const collect = (
    pos: { tokenId: bigint; pool: Pool; owed0: bigint; owed1: bigint },
    cb?: Cb,
  ) => {
    if (!address) return;
    const { calldata, value } = NonfungiblePositionManager.collectCallParameters({
      tokenId: pos.tokenId.toString(),
      expectedCurrencyOwed0: CurrencyAmount.fromRawAmount(pos.pool.token0, pos.owed0.toString()),
      expectedCurrencyOwed1: CurrencyAmount.fromRawAmount(pos.pool.token1, pos.owed1.toString()),
      recipient: address,
    });
    sendTransaction({ to: DEX.positionManager, data: calldata as `0x${string}`, value: BigInt(value) }, cb);
  };

  return { approve, mint, increase, remove, collect, busy };
}

// Small shim so the actions hook can fire either a typed contract write
// (approvals) or a raw calldata send (SDK-built mint/remove/collect) and track a
// single tx hash for the receipt wait.
function useWriteContractAndSend() {
  const w = useWriteContract();
  const s = useSendTransaction();
  return {
    writeContract: w.writeContract,
    sendTransaction: s.sendTransaction,
    data: w.data ?? s.data,
    isPending: w.isPending || s.isPending,
    reset: () => {
      w.reset();
      s.reset();
    },
  };
}

export { FeeAmount, TickMath, FEE_TIERS, Token, Position, CurrencyAmount, Percent };
