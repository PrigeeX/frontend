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

// ── Query helpers ────────────────────────────────────────────────────────────

export async function fetchGlobalMetrics(): Promise<GlobalMetrics | undefined> {
  const data = await query<{
    factories: { totalValueLockedUSD: string; totalVolumeUSD: string; totalFeesUSD: string; poolCount: string }[];
  }>(
    SUBGRAPHS.v3,
    `{ factories(first: 1) { totalValueLockedUSD totalVolumeUSD totalFeesUSD poolCount } }`,
  );
  const f = data?.factories?.[0];
  if (!f) return undefined;
  return {
    totalValueLockedUSD: Number(f.totalValueLockedUSD),
    volumeUSD: Number(f.totalVolumeUSD),
    feesUSD: Number(f.totalFeesUSD),
    poolCount: Number(f.poolCount),
  };
}

export async function fetchTopPools(): Promise<PoolRow[] | undefined> {
  const data = await query<{
    pools: {
      id: string;
      feeTier: string;
      totalValueLockedUSD: string;
      volumeUSD: string;
      token0: { symbol: string };
      token1: { symbol: string };
    }[];
  }>(
    SUBGRAPHS.v3,
    `{ pools(first: 20, orderBy: totalValueLockedUSD, orderDirection: desc) {
        id feeTier totalValueLockedUSD volumeUSD
        token0 { symbol } token1 { symbol }
    } }`,
  );
  if (!data?.pools) return undefined;
  return data.pools.map((p) => ({
    id: p.id,
    token0: p.token0.symbol,
    token1: p.token1.symbol,
    feeTier: Number(p.feeTier),
    tvlUSD: Number(p.totalValueLockedUSD),
    volumeUSD: Number(p.volumeUSD),
  }));
}

export async function fetchDayHistory(days = 30): Promise<DayPoint[] | undefined> {
  const data = await query<{
    prigeeXDayDatas: { date: number; tvlUSD: string; volumeUSD: string }[];
  }>(
    SUBGRAPHS.v3,
    `query($n: Int!) { prigeeXDayDatas(first: $n, orderBy: date, orderDirection: desc) { date tvlUSD volumeUSD } }`,
    { n: days },
  );
  if (!data?.prigeeXDayDatas) return undefined;
  return data.prigeeXDayDatas
    .map((d) => ({ date: d.date, tvlUSD: Number(d.tvlUSD), volumeUSD: Number(d.volumeUSD) }))
    .reverse();
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
