"use client";

// Minimal GraphQL client over the three deployed subgraphs (INF-01..05 are
// satisfied server-side; this is the frontend client only). Plain fetch POST -
// no Apollo, to keep the bundle light. Every helper degrades gracefully: if an
// endpoint is unset or the request fails it returns undefined, and callers fall
// back to RPC or show a "warming up" state (NFR-09).

import { useEffect, useState } from "react";
import { SUBGRAPHS, subgraphConfigured } from "./dex";

async function query<T>(url: string | undefined, gql: string, variables?: Record<string, unknown>): Promise<T | undefined> {
  if (!subgraphConfigured(url)) return undefined;
  try {
    const res = await fetch(url!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: gql, variables }),
    });
    if (!res.ok) return undefined;
    const json = await res.json();
    if (json.errors) {
      console.warn("[subgraph] query errors:", json.errors);
      return undefined;
    }
    return json.data as T;
  } catch (e) {
    console.warn("[subgraph] request failed:", e);
    return undefined;
  }
}

// ── Shapes (subset of the confirmed schema) ──────────────────────────────────

export type GlobalMetrics = {
  totalValueLockedUSD: number;
  volumeUSD: number;
  feesUSD: number;
  poolCount: number;
};

export type PoolRow = {
  id: string;
  token0: string;
  token1: string;
  feeTier: number;
  tvlUSD: number;
  volumeUSD: number;
};

export type DayPoint = { date: number; tvlUSD: number; volumeUSD: number };

export type ProtocolStats = {
  totalStaked: number;
  stakerCount: number;
  totalRewards: number;
  totalFeesDistributed: number;
};

// ── Analytics aggregator (/api/analytics) ────────────────────────────────────
// The deployed v3 subgraph is an event stub without factory/pool/swap entities,
// so DEX-wide analytics come from a server route that combines the stub's pool
// list with live on-chain reads and raw Swap logs.

export type AnalyticsSwap = {
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

type AnalyticsSnapshot = {
  metrics: { totalValueLockedUSD: number; volumeUSD: number; feesUSD: number; poolCount: number };
  pools: { id: string; token0: string; token1: string; feeTier: number; tvlUSD: number; volumeUSD: number }[];
  dayHistory: DayPoint[];
  recentSwaps: AnalyticsSwap[];
  prices: Record<string, number>;
  activity?: (AnalyticsSwap & { type: "swap" | "add" | "remove" })[];
};

export async function fetchAnalytics(user?: string): Promise<AnalyticsSnapshot | undefined> {
  try {
    const res = await fetch(`/api/analytics${user ? `?user=${user}` : ""}`);
    if (!res.ok) return undefined;
    return (await res.json()) as AnalyticsSnapshot;
  } catch (e) {
    console.warn("[analytics] request failed:", e);
    return undefined;
  }
}

// ── Query helpers ────────────────────────────────────────────────────────────

export async function fetchGlobalMetrics(): Promise<GlobalMetrics | undefined> {
  return (await fetchAnalytics())?.metrics;
}

export async function fetchTopPools(): Promise<PoolRow[] | undefined> {
  return (await fetchAnalytics())?.pools;
}

export async function fetchDayHistory(days = 30): Promise<DayPoint[] | undefined> {
  return (await fetchAnalytics())?.dayHistory?.slice(-days);
}

export async function fetchProtocolStats(): Promise<ProtocolStats | undefined> {
  const data = await query<{
    stakingProtocols: { totalStaked: string; stakerCount: string; totalRewardsDeposited: string }[];
    feeDistributors: { totalDistributed: string }[];
  }>(
    SUBGRAPHS.protocol,
    `{ stakingProtocols(first: 1) { totalStaked stakerCount totalRewardsDeposited }
       feeDistributors(first: 1) { totalDistributed } }`,
  );
  const s = data?.stakingProtocols?.[0];
  if (!s) return undefined;
  return {
    totalStaked: Number(s.totalStaked) / 1e18,
    stakerCount: Number(s.stakerCount),
    totalRewards: Number(s.totalRewardsDeposited) / 1e18,
    totalFeesDistributed: Number(data?.feeDistributors?.[0]?.totalDistributed ?? 0) / 1e18,
  };
}

// ── Portfolio helpers (token USD prices + per-wallet activity) ───────────────

/**
 * USD price for each requested token address, derived from the V3 subgraph
 * (token.derivedETH x bundle.ethPriceUSD). Returns a lowercased-address map, or
 * undefined when the subgraph is unset/unreachable so callers can show amounts
 * without a fabricated USD figure.
 */
export async function fetchTokenPricesUSD(addresses: string[]): Promise<Record<string, number> | undefined> {
  const prices = (await fetchAnalytics())?.prices;
  if (!prices) return undefined;
  const out: Record<string, number> = {};
  for (const a of addresses) {
    const p = prices[a.toLowerCase()];
    if (p !== undefined) out[a.toLowerCase()] = p;
  }
  return out;
}

export type ActivityItem = {
  id: string;
  type: "swap" | "add" | "remove";
  timestamp: number;
  txId: string;
  token0: string;
  token1: string;
  amount0: number;
  amount1: number;
  amountUSD: number;
};

/** Recent on-chain activity (swaps + mints + burns) initiated by a wallet. */
export async function fetchUserActivity(user: string): Promise<ActivityItem[] | undefined> {
  const activity = (await fetchAnalytics(user))?.activity;
  if (!activity) return undefined;
  return activity.map((a) => ({
    id: a.id,
    type: a.type,
    timestamp: a.timestamp,
    txId: a.txId,
    token0: a.token0,
    token1: a.token1,
    amount0: a.amount0,
    amount1: a.amount1,
    amountUSD: a.amountUSD,
  }));
}

// ── Tiny async hook ──────────────────────────────────────────────────────────

/** Run an async subgraph fetch, re-running when `deps` change. */
export function useAsync<T>(fn: () => Promise<T | undefined>, deps: React.DependencyList = []) {
  const [state, setState] = useState<{ data?: T; loading: boolean }>({ loading: true });
  useEffect(() => {
    let alive = true;
    fn().then((d) => {
      if (alive) setState({ data: d, loading: false });
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

export const subgraphReady = subgraphConfigured(SUBGRAPHS.v3);
