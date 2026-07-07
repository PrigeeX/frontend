"use client";

// Analytics dashboard (FE-30..34). Global protocol metrics, a TVL/volume history
// chart, and a per-pool table - all from the V3 subgraph via lib/subgraph.ts.
// When the subgraph is unset/unreachable it shows an honest "warming up" state
// rather than fabricating numbers.

import React, { useState } from "react";
import { fmtNum, fmtUsd } from "@/lib/format";
import {
  fetchGlobalMetrics,
  fetchTopPools,
  fetchDayHistory,
  useAsync,
  subgraphReady,
  type DayPoint,
} from "@/lib/subgraph";

const RANGES = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
];

export function AnalyticsPage() {
  const [range, setRange] = useState(30);
  const { data: metrics, loading: mLoading } = useAsync(fetchGlobalMetrics, []);
  const { data: pools, loading: pLoading } = useAsync(fetchTopPools, []);
  const { data: history } = useAsync(() => fetchDayHistory(range), [range]);

  return (
    <div style={{ minWidth: 0 }}>
      <div className="col gap-8" style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0, letterSpacing: "-0.01em" }}>Analytics</h1>
        <p className="muted" style={{ margin: 0, fontSize: 14 }}>
          Protocol-wide liquidity, volume and fee activity, indexed from the subgraph.
        </p>
      </div>

      {!subgraphReady ? (
        <Warming />
      ) : (
        <>
          <div className="analytics-grid" style={{ marginBottom: 20 }}>
            <MetricCard label="Total value locked" value={metrics ? fmtUsd(metrics.totalValueLockedUSD) : "-"} loading={mLoading} accent />
            <MetricCard label="Volume (all-time)" value={metrics ? fmtUsd(metrics.volumeUSD) : "-"} loading={mLoading} />
            <MetricCard label="Fees (all-time)" value={metrics ? fmtUsd(metrics.feesUSD) : "-"} loading={mLoading} />
            <MetricCard label="Active pools" value={metrics ? fmtNum(metrics.poolCount, 0) : "-"} loading={mLoading} />
          </div>

          <div className="panel" style={{ padding: 20, marginBottom: 20 }}>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
              <span className="caps">TVL &amp; volume</span>
              <div className="row gap-6">
                {RANGES.map((r) => (
                  <button
                    key={r.days}
                    className="chip"
                    onClick={() => setRange(r.days)}
                    style={{ color: range === r.days ? "var(--accent)" : "var(--text-2)", borderColor: range === r.days ? "color-mix(in oklch, var(--accent) 40%, transparent)" : "var(--line)" }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <HistoryChart points={history} />
          </div>

          <div className="panel">
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
              <span className="caps">Pools</span>
            </div>
            <PoolTable pools={pools} loading={pLoading} />
          </div>
        </>
      )}
    </div>
  );
}

const MetricCard = ({ label, value, loading, accent }: { label: string; value: string; loading?: boolean; accent?: boolean }) => (
  <div className="panel" style={{ padding: 16, borderColor: accent ? "color-mix(in oklch, var(--accent) 30%, var(--line))" : "var(--line)" }}>
    <div className="caps">{label}</div>
    <div className="num" style={{ fontSize: 22, fontWeight: 500, marginTop: 8, color: accent ? "var(--accent)" : "var(--text)" }}>
      {loading ? "-" : value}
    </div>
  </div>
);

function HistoryChart({ points }: { points?: DayPoint[] }) {
  if (!points || points.length < 2) {
    return <div className="muted" style={{ padding: "50px 0", textAlign: "center", fontSize: 13 }}>{points ? "Not enough history yet." : "Loading…"}</div>;
  }
  const W = 760, H = 220, pad = 24;
  const maxTvl = Math.max(...points.map((p) => p.tvlUSD), 1);
  const maxVol = Math.max(...points.map((p) => p.volumeUSD), 1);
  const x = (i: number) => pad + (i / (points.length - 1)) * (W - pad * 2);
  const yTvl = (v: number) => H - pad - (v / maxTvl) * (H - pad * 2);
  const barW = Math.max(2, (W - pad * 2) / points.length - 2);

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${yTvl(p.tvlUSD)}`).join(" ");
  const area = `${line} L${x(points.length - 1)},${H - pad} L${x(0)},${H - pad} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
      {/* Volume bars */}
      {points.map((p, i) => (
        <rect key={i} x={x(i) - barW / 2} y={H - pad - (p.volumeUSD / maxVol) * (H - pad * 2) * 0.5} width={barW} height={(p.volumeUSD / maxVol) * (H - pad * 2) * 0.5} fill="var(--line-2)" opacity={0.6} rx={1} />
      ))}
      {/* TVL area + line */}
      <path d={area} fill="color-mix(in oklch, var(--accent) 10%, transparent)" />
      <path d={line} fill="none" stroke="var(--accent)" strokeWidth={1.6} />
    </svg>
  );
}

function PoolTable({ pools, loading }: { pools?: { id: string; token0: string; token1: string; feeTier: number; tvlUSD: number; volumeUSD: number }[]; loading?: boolean }) {
  if (loading) return <div style={{ padding: 40 }} className="skeleton" />;
  if (!pools || pools.length === 0) return <div className="muted" style={{ padding: 40, textAlign: "center", fontSize: 13 }}>No pools indexed yet.</div>;
  return (
    <div>
      <div className="row" style={{ padding: "10px 20px", fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".05em" }}>
        <span style={{ flex: 2 }}>Pool</span>
        <span style={{ flex: 1, textAlign: "right" }}>TVL</span>
        <span style={{ flex: 1, textAlign: "right" }}>Volume</span>
      </div>
      {pools.map((p) => (
        <div key={p.id} className="row" style={{ padding: "12px 20px", borderTop: "1px solid var(--line)", fontSize: 13 }}>
          <span style={{ flex: 2 }} className="row gap-8">
            <span style={{ fontWeight: 500 }}>{p.token0} / {p.token1}</span>
            <span className="chip" style={{ fontSize: 10, padding: "1px 6px" }}>{(p.feeTier / 10000).toFixed(2)}%</span>
          </span>
          <span style={{ flex: 1, textAlign: "right" }} className="mono">{fmtUsd(p.tvlUSD)}</span>
          <span style={{ flex: 1, textAlign: "right" }} className="mono">{fmtUsd(p.volumeUSD)}</span>
        </div>
      ))}
    </div>
  );
}

const Warming = () => (
  <div className="panel" style={{ padding: 56, textAlign: "center" }}>
    <div style={{ fontSize: 16, fontWeight: 600 }}>Analytics warming up</div>
    <div className="muted" style={{ fontSize: 13, marginTop: 8, maxWidth: 440, marginInline: "auto" }}>
      The analytics subgraph is not configured for this deployment. Set the subgraph URLs in packages/dex-config.ts to populate this dashboard.
    </div>
  </div>
);
