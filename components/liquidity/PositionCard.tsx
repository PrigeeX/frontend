"use client";

// One LP position, shown in the /pool list and the portfolio. Surfaces NFT id,
// pair, fee tier, range, held amounts, unclaimed fees and the in/out-of-range
// status dot (FE-23): warm dot = in range, dim dot = out of range (per THEME.md).

import React from "react";
import Link from "next/link";
import { fmtNum } from "@/lib/format";
import type { PositionInfo } from "@/lib/liquidity";

const feeLabel = (fee: number) => `${(fee / 10000).toFixed(2)}%`;

export function PositionCard({ p, href }: { p: PositionInfo; href?: string }) {
  const dotColor = p.closed
    ? "var(--text-3)"
    : p.inRange
      ? "var(--accent)"
      : "var(--ink-dim, var(--text-3))";
  const statusLabel = p.closed ? "Closed" : p.inRange ? "In range" : "Out of range";

  const body = (
    <div
      className="panel"
      style={{ padding: 18, display: "grid", gap: 14, transition: "border-color .15s" }}
    >
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div className="col gap-4">
          <div className="row gap-8" style={{ alignItems: "center" }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>
              {p.symbol0} / {p.symbol1}
            </span>
            <span className="chip" style={{ fontSize: 10, padding: "1px 7px" }}>{feeLabel(p.fee)}</span>
          </div>
          <span className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>#{p.tokenId.toString()}</span>
        </div>
        <div className="row gap-6" style={{ alignItems: "center", fontSize: 12, color: "var(--text-2)" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, boxShadow: p.inRange && !p.closed ? "0 0 6px var(--accent)" : "none" }} />
          {statusLabel}
        </div>
      </div>

      <div className="row" style={{ justifyContent: "space-between", fontSize: 12, color: "var(--text-3)" }}>
        <span>Range</span>
        <span className="mono" style={{ color: "var(--text-2)" }}>
          {p.priceLower} – {p.priceUpper} {p.symbol1}
        </span>
      </div>

      <div className="row" style={{ justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <Metric label="Holdings" value={`${fmtNum(p.amount0)} ${p.symbol0} · ${fmtNum(p.amount1)} ${p.symbol1}`} />
        <Metric
          label="Unclaimed fees"
          value={`${fmtNum(p.fees0, 6)} ${p.symbol0} · ${fmtNum(p.fees1, 6)} ${p.symbol1}`}
          accent={p.fees0 + p.fees1 > 0}
        />
      </div>
    </div>
  );

  return href ? (
    <Link href={href} style={{ display: "block" }} className="position-card-link">
      {body}
    </Link>
  ) : (
    body
  );
}

const Metric = ({ label, value, accent }: { label: string; value: string; accent?: boolean }) => (
  <div className="col gap-4" style={{ minWidth: 0 }}>
    <span className="caps">{label}</span>
    <span className="mono" style={{ fontSize: 12.5, color: accent ? "var(--accent)" : "var(--text)" }}>
      {value}
    </span>
  </div>
);
