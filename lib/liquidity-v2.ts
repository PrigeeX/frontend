"use client";

// V2 (constant-product) liquidity adapter, the classic counterpart to
// lib/liquidity.ts. Components never touch the V2 ABIs or pair math directly -
// they call useV2Pair / useV2Positions / useV2Actions.
//
//   reads : useV2Pair(a, b)   -> live reserves + the caller's LP balance/allowance
//           useV2Positions()  -> every V2 pair (over DEX_TOKENS) the wallet has LP in
//   writes: useV2Actions()    -> approve / addLiquidity / removeLiquidity via the router
//
// Pair discovery is on-chain (factory.getPair -> reserves/balanceOf), not via the
// subgraph: the deployment's token set is small and the constant-product reserves
// are cheap to read, so this stays reliable without any indexer.

import { useEffect, useMemo } from "react";
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { parseUnits } from "viem";
import { Token } from "@uniswap/sdk-core";
import { erc20Abi, v2FactoryAbi, v2PairAbi, v2RouterAbi } from "./contracts";
import { DEX } from "./dex";
import { DEX_TOKENS } from "./liquidity";

const ZERO = "0x0000000000000000000000000000000000000000" as const;

type Cb = { onSuccess?: () => void; onError?: (e: Error) => void };

/** All unordered token pairs that could host a V2 pool, from the deployment's token set. */
export const V2_CANDIDATE_PAIRS: [Token, Token][] = (() => {
  const out: [Token, Token][] = [];
  for (let i = 0; i < DEX_TOKENS.length; i++)
    for (let j = i + 1; j < DEX_TOKENS.length; j++) out.push([DEX_TOKENS[i], DEX_TOKENS[j]]);
  return out;
})();

export type V2PairState = {
  /** Pair (LP token) address, or undefined if the pool does not exist. */
  pairAddress?: `0x${string}`;
  exists: boolean;
  /** Reserves quoted in tokenA / tokenB order (human units + raw wei). */
  reserveA: number;
  reserveB: number;
  reserveARaw: bigint;
  reserveBRaw: bigint;
  totalSupply: bigint;
  /** Caller's LP token balance (raw + human) and router allowance on it. */
  lpBalance: bigint;
  lpBalanceNum: number;
  lpAllowance: bigint;
  /** Caller's pooled share of each token (human units). */
  amountA: number;
  amountB: number;
  sharePct: number;
};

export type V2PositionInfo = V2PairState & { tokenA: Token; tokenB: Token };

const toNum = (v: bigint, decimals: number) => Number(v) / 10 ** decimals;

/** Derive a V2PairState from the raw pair reads, mapping reserve0/1 to A/B order. */
function deriveState(
  tokenA: Token,
  tokenB: Token,
  pairAddress: `0x${string}` | undefined,
  token0Addr: string | undefined,
  reserves: readonly [bigint, bigint, number] | undefined,
  totalSupply: bigint | undefined,
  lpBalance: bigint | undefined,
  lpAllowance: bigint | undefined,
): V2PairState {
  const exists = Boolean(pairAddress && pairAddress !== ZERO);
  const aIs0 = token0Addr ? token0Addr.toLowerCase() === tokenA.address.toLowerCase() : true;
  const r0 = reserves?.[0] ?? 0n;
  const r1 = reserves?.[1] ?? 0n;
  const rawA = aIs0 ? r0 : r1;
  const rawB = aIs0 ? r1 : r0;
  const reserveA = toNum(rawA, tokenA.decimals);
  const reserveB = toNum(rawB, tokenB.decimals);
  const supply = totalSupply ?? 0n;
  const bal = lpBalance ?? 0n;
  const share = supply > 0n ? Number(bal) / Number(supply) : 0;
  return {
    pairAddress: exists ? pairAddress : undefined,
    exists,
    reserveA,
    reserveB,
    reserveARaw: rawA,
    reserveBRaw: rawB,
    totalSupply: supply,
    lpBalance: bal,
    lpBalanceNum: toNum(bal, 18),
    lpAllowance: lpAllowance ?? 0n,
    amountA: reserveA * share,
    amountB: reserveB * share,
    sharePct: share * 100,
  };
}

// ── Single pair (for the add / remove forms) ─────────────────────────────────

export function useV2Pair(tokenA?: Token, tokenB?: Token) {
  const { address } = useAccount();
  const ready = Boolean(tokenA && tokenB);

  const { data: pairAddr } = useReadContract({
    address: DEX.v2Factory,
    abi: v2FactoryAbi,
    functionName: "getPair",
    args: ready ? [tokenA!.address as `0x${string}`, tokenB!.address as `0x${string}`] : undefined,
    query: { enabled: ready },
  });

  const exists = Boolean(pairAddr && pairAddr !== ZERO);
  const pair = pairAddr as `0x${string}` | undefined;
  const user = (address ?? ZERO) as `0x${string}`;

  const { data, refetch } = useReadContracts({
    contracts: exists
      ? [
          { address: pair!, abi: v2PairAbi, functionName: "token0" as const },
          { address: pair!, abi: v2PairAbi, functionName: "getReserves" as const },
          { address: pair!, abi: v2PairAbi, functionName: "totalSupply" as const },
          { address: pair!, abi: v2PairAbi, functionName: "balanceOf" as const, args: [user] },
          { address: pair!, abi: v2PairAbi, functionName: "allowance" as const, args: [user, DEX.v2Router] },
        ]
      : [],
    query: { enabled: exists, refetchInterval: 12_000 },
  });

  const state = useMemo<V2PairState>(() => {
    const ok = <T,>(i: number): T | undefined => (data?.[i]?.status === "success" ? (data[i].result as T) : undefined);
    return deriveState(
      tokenA ?? DEX_TOKENS[0],
      tokenB ?? DEX_TOKENS[1],
      pair,
      ok<string>(0),
      ok<readonly [bigint, bigint, number]>(1),
      ok<bigint>(2),
      ok<bigint>(3),
      ok<bigint>(4),
    );
  }, [data, pair, tokenA, tokenB]);

  return { ...state, refetch };
}

// ── All of the wallet's V2 positions (for the pool list + portfolio) ─────────

export function useV2Positions() {
  const { address } = useAccount();
  const user = (address ?? ZERO) as `0x${string}`;

  // 1. Resolve every candidate pair address.
  const { data: pairData } = useReadContracts({
    contracts: V2_CANDIDATE_PAIRS.map(([a, b]) => ({
      address: DEX.v2Factory,
      abi: v2FactoryAbi,
      functionName: "getPair" as const,
      args: [a.address as `0x${string}`, b.address as `0x${string}`] as const,
    })),
  });

  const pairAddrs = useMemo(
    () =>
      V2_CANDIDATE_PAIRS.map((_, i) => {
        const r = pairData?.[i];
        const addr = r?.status === "success" ? (r.result as `0x${string}`) : undefined;
        return addr && addr !== ZERO ? addr : undefined;
      }),
    [pairData],
  );

  // 2. For each existing pair, read token0 / reserves / supply / the caller's LP.
  const { data: meta, status, refetch } = useReadContracts({
    contracts: pairAddrs.flatMap((addr) =>
      addr
        ? [
            { address: addr, abi: v2PairAbi, functionName: "token0" as const },
            { address: addr, abi: v2PairAbi, functionName: "getReserves" as const },
            { address: addr, abi: v2PairAbi, functionName: "totalSupply" as const },
            { address: addr, abi: v2PairAbi, functionName: "balanceOf" as const, args: [user] },
            { address: addr, abi: v2PairAbi, functionName: "allowance" as const, args: [user, DEX.v2Router] },
          ]
        : [],
    ),
    query: { enabled: pairAddrs.some(Boolean), refetchInterval: 15_000 },
  });

  const positions = useMemo<V2PositionInfo[]>(() => {
    if (!meta) return [];
    const out: V2PositionInfo[] = [];
    let cursor = 0;
    pairAddrs.forEach((addr, i) => {
      if (!addr) return;
      const slice = meta.slice(cursor, cursor + 5);
      cursor += 5;
      const ok = <T,>(j: number): T | undefined => (slice[j]?.status === "success" ? (slice[j].result as T) : undefined);
      const [tokenA, tokenB] = V2_CANDIDATE_PAIRS[i];
      const state = deriveState(
        tokenA,
        tokenB,
        addr,
        ok<string>(0),
        ok<readonly [bigint, bigint, number]>(1),
        ok<bigint>(2),
        ok<bigint>(3),
        ok<bigint>(4),
      );
      if (state.lpBalance > 0n) out.push({ ...state, tokenA, tokenB });
    });
    return out;
  }, [meta, pairAddrs]);

  const loading = Boolean(address) && pairAddrs.some(Boolean) && status === "pending";
  return { positions, loading, refetch };
}

// ── Writes ───────────────────────────────────────────────────────────────────

export function useV2Actions(onMined?: () => void) {
  const { address } = useAccount();
  const { writeContract, data: txHash, isPending, reset } = useWriteContract();
  const { isLoading: mining, isSuccess: mined } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (mined) {
      onMined?.();
      reset();
    }
  }, [mined, onMined, reset]);

  const busy = isPending || mining;
  const deadline = () => BigInt(Math.floor(Date.now() / 1000) + 30 * 60);

  const approve = (token: `0x${string}`, spender: `0x${string}`, amount: bigint, cb?: Cb) =>
    writeContract({ address: token, abi: erc20Abi, functionName: "approve", args: [spender, amount] }, cb);

  const addLiquidity = (
    tokenA: `0x${string}`,
    tokenB: `0x${string}`,
    amountADesired: bigint,
    amountBDesired: bigint,
    amountAMin: bigint,
    amountBMin: bigint,
    cb?: Cb,
  ) => {
    if (!address) return;
    writeContract(
      {
        address: DEX.v2Router,
        abi: v2RouterAbi,
        functionName: "addLiquidity",
        args: [tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin, address, deadline()],
      },
      cb,
    );
  };

  const removeLiquidity = (
    tokenA: `0x${string}`,
    tokenB: `0x${string}`,
    liquidity: bigint,
    amountAMin: bigint,
    amountBMin: bigint,
    cb?: Cb,
  ) => {
    if (!address) return;
    writeContract(
      {
        address: DEX.v2Router,
        abi: v2RouterAbi,
        functionName: "removeLiquidity",
        args: [tokenA, tokenB, liquidity, amountAMin, amountBMin, address, deadline()],
      },
      cb,
    );
  };

  return { approve, addLiquidity, removeLiquidity, busy };
}

// ── Helpers shared by the V2 UI ──────────────────────────────────────────────

/** Parse a human amount to wei, tolerant of empty/invalid input. */
export function parseAmount(amount: string, decimals: number): bigint {
  if (!amount) return 0n;
  try {
    return parseUnits(amount, decimals);
  } catch {
    return 0n;
  }
}

/** Apply a slippage tolerance (percent) to a desired amount, flooring to wei. */
export function withSlippage(amount: bigint, slippagePct: number): bigint {
  return (amount * BigInt(Math.round((100 - slippagePct) * 100))) / 10_000n;
}
