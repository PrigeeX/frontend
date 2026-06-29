"use client";

// Portfolio - a single read-only view of everything the connected wallet holds
// on the protocol: token balances, V3 + V2 liquidity positions, the staking
// position, and recent on-chain activity. Every figure here comes from a direct
// RPC read or the V3 subgraph (prices + activity); there is no backend, so when
// the subgraph is unreachable the page degrades to amounts without USD rather
// than inventing values.

import React, { useState } from "react";
import Link from "next/link";
import { useAccount, useReadContracts } from "wagmi";
import { Icon, TokenIcon } from "./icons";
import { useWallet } from "./wallet";
import { PositionCard } from "./liquidity/PositionCard";
import { fmtNum, fmtUsd, shortAddr } from "@/lib/format";
import { erc20Abi } from "@/lib/contracts";
import { DEX, txUrl } from "@/lib/dex";
import { DEX_TOKENS, usePositions } from "@/lib/liquidity";
import { useV2Positions, type V2PositionInfo } from "@/lib/liquidity-v2";
import { useStaking, fmtPgx } from "@/lib/staking";
import { fetchTokenPricesUSD, fetchUserActivity, useAsync, type ActivityItem } from "@/lib/subgraph";

type Tab = "tokens" | "pools" | "activity";

export function PortfolioPage() {
  const wallet = useWallet();
  const { address } = useAccount();
  const [tab, setTab] = useState<Tab>("tokens");

  // ── Data ───────────────────────────────────────────────────────────────────
  const { data: prices } = useAsync(() => fetchTokenPricesUSD(DEX_TOKENS.map((t) => t.address)), []);
  const priceOf = (addr: string) => prices?.[addr.toLowerCase()];
  const hasPrices = Boolean(prices && Object.keys(prices).length > 0);

  const { data: balData } = useReadContracts({
    contracts: DEX_TOKENS.map((t) => ({
      address: t.address as `0x${string}`,
      abi: erc20Abi,
      functionName: "balanceOf" as const,
      args: [address!] as const,
    })),
    query: { enabled: Boolean(address), refetchInterval: 15_000 },
  });
  const balances = DEX_TOKENS.map((t, i) => ({
    token: t,
    amount: balData?.[i]?.status === "success" ? Number(balData[i].result) / 10 ** t.decimals : 0,
  }));

  const { positions: v3, loading: v3Loading } = usePositions();
  const { positions: v2, loading: v2Loading } = useV2Positions();
  const { state: staking } = useStaking();
  const stakedPgx = fmtPgx(staking.staked);
  const earnedPgx = fmtPgx(staking.earned);

  const { data: activity, loading: actLoading } = useAsync(
    () => (address ? fetchUserActivity(address) : Promise.resolve([])),
    [address],
  );

  // ── Valuation (only when the subgraph gave us prices) ───────────────────────
  const pgxPrice = priceOf(DEX.PGX) ?? 0;
  const tokensUsd = balances.reduce((s, b) => s + b.amount * (priceOf(b.token.address) ?? 0), 0);
  const stakingUsd = (stakedPgx + earnedPgx) * pgxPrice;
  const v3Usd = v3.reduce((s, p) => s + p.amount0 * (priceOf(p.token0) ?? 0) + p.amount1 * (priceOf(p.token1) ?? 0), 0);
  const v2Usd = v2.reduce((s, p) => s + p.amountA * (priceOf(p.tokenA.address) ?? 0) + p.amountB * (priceOf(p.tokenB.address) ?? 0), 0);
  const poolsUsd = v3Usd + v2Usd;
  const totalUsd = tokensUsd + stakingUsd + poolsUsd;

  const poolCount = v3.length + v2.length;
  const usd = (v: number) => (hasPrices ? fmtUsd(v) : "-");

  // ── Empty / disconnected ────────────────────────────────────────────────────
  if (!wallet.connected) {
    return (
      <main className="container-app" style={pagePad}>
        <Header total="-" />
        <div className="panel" style={{ padding: 56, textAlign: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Connect your wallet</div>
          <div className="muted" style={{ fontSize: 13, marginTop: 8 }}>
            Connect to see your balances, positions, staking and recent activity in one place.
          </div>
          <div style={{ marginTop: 20 }}>
            <button className="btn btn-primary" onClick={wallet.open}>Connect wallet</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container-app" style={pagePad}>
      <Header total={usd(totalUsd)} address={address} />

      {/* Summary cards */}
      <div className="stake-summary" style={{ display: "grid", gap: 12, marginBottom: 20 }}>
        <SummaryCard label="Tokens" value={usd(tokensUsd)} sub={`${balances.filter((b) => b.amount > 0).length} held`} />
        <SummaryCard label="Liquidity" value={usd(poolsUsd)} sub={poolCount > 0 ? `${poolCount} position${poolCount === 1 ? "" : "s"}` : "None"} accent />
        <SummaryCard label="Staked PGX" value={fmtNum(stakedPgx)} sub={hasPrices ? fmtUsd(stakedPgx * pgxPrice) : "PGX"} />
        <SummaryCard label="Claimable" value={`${fmtNum(earnedPgx, 4)} PGX`} sub={earnedPgx > 0 ? "Ready to claim" : "-"} />
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 18 }}>
        <button className={tab === "tokens" ? "active" : ""} onClick={() => setTab("tokens")}>Tokens</button>
        <button className={tab === "pools" ? "active" : ""} onClick={() => setTab("pools")}>Pools</button>
        <button className={tab === "activity" ? "active" : ""} onClick={() => setTab("activity")}>Activity</button>
      </div>

      {tab === "tokens" && (
        <div className="panel" style={{ padding: 8 }}>
          {balances.map((b) => {
            const price = priceOf(b.token.address);
            return (
              <div key={b.token.address} className="row portfolio-row" style={rowStyle}>
                <div className="row gap-12" style={{ alignItems: "center", minWidth: 0 }}>
                  <TokenIcon symbol={b.token.symbol === "WETH" ? "ETH" : b.token.symbol!} />
                  <div className="col gap-4" style={{ minWidth: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{b.token.symbol}</span>
                    <span className="muted" style={{ fontSize: 12 }}>{b.token.name}</span>
                  </div>
                </div>
                <div className="col gap-4" style={{ alignItems: "flex-end" }}>
                  <span className="num" style={{ fontSize: 14, fontWeight: 500 }}>{fmtNum(b.amount)}</span>
                  <span className="muted" style={{ fontSize: 12 }}>{price !== undefined ? fmtUsd(b.amount * price) : "-"}</span>
                </div>
              </div>
            );
          })}
          {/* Staked PGX surfaced alongside spot balances */}
          {stakedPgx > 0 && (
            <div className="row portfolio-row" style={{ ...rowStyle, borderBottom: "none" }}>
              <div className="row gap-12" style={{ alignItems: "center", minWidth: 0 }}>
                <TokenIcon symbol="PGX" />
                <div className="col gap-4" style={{ minWidth: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>PGX <span className="chip" style={{ fontSize: 10, padding: "1px 7px", marginLeft: 4 }}>Staked</span></span>
                  <Link href="/stake" className="muted" style={{ fontSize: 12 }}>Manage in Staking</Link>
                </div>
              </div>
              <div className="col gap-4" style={{ alignItems: "flex-end" }}>
                <span className="num" style={{ fontSize: 14, fontWeight: 500 }}>{fmtNum(stakedPgx)}</span>
                <span className="muted" style={{ fontSize: 12 }}>{hasPrices ? fmtUsd(stakedPgx * pgxPrice) : "-"}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "pools" && (
        <PoolsTab v3={v3} v2={v2} loading={v3Loading || v2Loading} />
      )}

      {tab === "activity" && (
        <ActivityTab items={activity} loading={actLoading} />
      )}
    </main>
  );
}

// ── Sections ──────────────────────────────────────────────────────────────────

function PoolsTab({ v3, v2, loading }: { v3: ReturnType<typeof usePositions>["positions"]; v2: V2PositionInfo[]; loading: boolean }) {
  if (loading && v3.length === 0 && v2.length === 0) {
    return (
      <div className="pool-grid" style={{ display: "grid", gap: 16 }}>
        {[0, 1].map((i) => <div key={i} className="panel skeleton" style={{ padding: 18, height: 150 }} />)}
      </div>
    );
  }
  if (v3.length === 0 && v2.length === 0) {
    return (
      <div className="panel" style={{ padding: 56, textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 600 }}>No liquidity positions</div>
        <div className="muted" style={{ fontSize: 13, marginTop: 8 }}>Provide liquidity to start earning fees on swaps.</div>
        <div style={{ marginTop: 20 }}>
          <Link className="btn btn-primary" href="/pool/new"><Icon.Plus size={14} /> New position</Link>
        </div>
      </div>
    );
  }
  return (
    <div className="col gap-24">
      {v3.length > 0 && (
        <div>
          <h2 style={sectionHead}>Concentrated (V3)</h2>
          <div className="pool-grid" style={{ display: "grid", gap: 16 }}>
            {v3.map((p) => <PositionCard key={p.tokenId.toString()} p={p} href={`/pool/${p.tokenId.toString()}`} />)}
          </div>
        </div>
      )}
      {v2.length > 0 && (
        <div>
          <h2 style={sectionHead}>Classic (V2)</h2>
          <div className="pool-grid" style={{ display: "grid", gap: 16 }}>
            {v2.map((p) => <V2Mini key={p.pairAddress} p={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function V2Mini({ p }: { p: V2PositionInfo }) {
  return (
    <div className="panel" style={{ padding: 18, display: "grid", gap: 12 }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div className="row gap-8" style={{ alignItems: "center" }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{p.tokenA.symbol} / {p.tokenB.symbol}</span>
          <span className="chip" style={{ fontSize: 10, padding: "1px 7px" }}>V2</span>
        </div>
        <span className="mono" style={{ fontSize: 12.5, color: "var(--accent)" }}>{p.sharePct.toFixed(4)}%</span>
      </div>
      <div className="row" style={{ justifyContent: "space-between", fontSize: 12, color: "var(--text-3)" }}>
        <span>Pooled</span>
        <span className="mono" style={{ color: "var(--text-2)" }}>{fmtNum(p.amountA)} {p.tokenA.symbol} · {fmtNum(p.amountB)} {p.tokenB.symbol}</span>
      </div>
      <Link href="/pool" className="btn btn-ghost btn-sm" style={{ justifyContent: "center" }}>Manage in Liquidity</Link>
    </div>
  );
}

function ActivityTab({ items, loading }: { items?: ActivityItem[]; loading: boolean }) {
  if (loading) {
    return <div className="panel skeleton" style={{ padding: 18, height: 220 }} />;
  }
  if (!items || items.length === 0) {
    return (
      <div className="panel" style={{ padding: 48, textAlign: "center" }}>
        <div style={{ fontSize: 14, color: "var(--text-2)" }}>No recent activity</div>
        <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>
          Your swaps and liquidity actions will appear here, indexed from the subgraph.
        </div>
      </div>
    );
  }
  return (
    <div className="panel" style={{ padding: 8 }}>
      {items.map((it) => {
        const meta = ACTIVITY_META[it.type];
        return (
          <a key={it.id} href={txUrl(it.txId)} target="_blank" rel="noreferrer" className="row portfolio-row" style={rowStyle}>
            <div className="row gap-12" style={{ alignItems: "center", minWidth: 0 }}>
              <span className="portfolio-act-ic" style={{ color: meta.color }}>{meta.icon}</span>
              <div className="col gap-4" style={{ minWidth: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{meta.label}</span>
                <span className="muted" style={{ fontSize: 12 }}>{it.token0} / {it.token1}</span>
              </div>
            </div>
            <div className="col gap-4" style={{ alignItems: "flex-end" }}>
              <span className="num" style={{ fontSize: 13 }}>{it.amountUSD > 0 ? fmtUsd(it.amountUSD) : `${fmtNum(Math.abs(it.amount0))} ${it.token0}`}</span>
              <span className="muted" style={{ fontSize: 12 }}>{relTime(it.timestamp)} <Icon.Ext size={10} /></span>
            </div>
          </a>
        );
      })}
    </div>
  );
}

// ── Bits ──────────────────────────────────────────────────────────────────────

const Header = ({ total, address }: { total: string; address?: string }) => (
  <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
    <div className="col gap-8">
      <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0, letterSpacing: "-0.01em" }}>Portfolio</h1>
      <p className="muted" style={{ margin: 0, fontSize: 14 }}>Your balances, positions, staking and activity across PrigeeX.</p>
    </div>
    <div className="col gap-4" style={{ alignItems: "flex-end" }}>
      <span className="caps">Net value</span>
      <span className="num" style={{ fontSize: 34, fontWeight: 500, letterSpacing: "-0.02em" }}>{total}</span>
      {address && <span className="mono" style={{ fontSize: 12, color: "var(--text-3)" }}>{shortAddr(address)}</span>}
    </div>
  </div>
);

const SummaryCard = ({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) => (
  <div
    className="panel"
    style={{
      padding: 16,
      background: accent ? "color-mix(in oklch, var(--accent) 8%, var(--panel))" : "var(--panel)",
      borderColor: accent ? "color-mix(in oklch, var(--accent) 30%, var(--line))" : "var(--line)",
    }}
  >
    <div className="caps">{label}</div>
    <div className="num" style={{ fontSize: 22, fontWeight: 500, marginTop: 8, color: accent ? "var(--accent)" : "var(--text)" }}>{value}</div>
    <div className="num" style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>{sub}</div>
  </div>
);

const ACTIVITY_META: Record<ActivityItem["type"], { label: string; icon: React.ReactNode; color: string }> = {
  swap: { label: "Swap", icon: <Icon.Swap size={15} />, color: "var(--text-2)" },
  add: { label: "Add liquidity", icon: <Icon.Plus size={15} />, color: "var(--accent)" },
  remove: { label: "Remove liquidity", icon: <Icon.Minus size={15} />, color: "var(--text-2)" },
};

const relTime = (ts: number) => {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const pagePad = { paddingTop: 40, paddingBottom: 80, paddingLeft: 32, paddingRight: 32 } as const;
const sectionHead = { fontSize: 14, fontWeight: 600, margin: "0 0 12px", color: "var(--text-2)" } as const;
const rowStyle = {
  justifyContent: "space-between",
  alignItems: "center",
  padding: "14px 14px",
  borderBottom: "1px solid var(--line)",
} as const;
