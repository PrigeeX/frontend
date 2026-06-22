"use client";

import React from "react";
import { Icon } from "./icons";
import { useWallet } from "./wallet";
import { useToast } from "./toast";
import { fmtNum } from "@/lib/format";
import { useStaking, useStakingActions, fmtPgx } from "@/lib/staking";

// Honest rewards view: the only reward stream that exists on-chain in Phase 1 is the
// pro-rata share of protocol fees distributed by the staking contract. Trading rebates,
// referrals, quests, fee-discount tiers, and per-stream history are not implemented and
// are deliberately not shown. Aggregate history / charts will return here once the
// protocol subgraph is wired.
export const RewardsPage = () => {
  const wallet = useWallet();
  const toast = useToast();

  const { state, loading, hasError, refetch } = useStaking();
  const { claim, busy } = useStakingActions(refetch);

  const earnedPgx = fmtPgx(state.earned);
  const stakedPgx = fmtPgx(state.staked);
  const showLoading = loading && state.earned === undefined;

  const onClaim = () => {
    if (!wallet.connected) {
      wallet.open();
      return;
    }
    if (earnedPgx <= 0) return;
    claim({
      onSuccess: () => toast({ title: "Claim submitted", body: `${fmtNum(earnedPgx, 4)} PGX` }),
      onError: (e) => toast({ title: "Claim failed", body: e.message, kind: "error" }),
    });
  };

  const claimLabel = busy
    ? "Claiming…"
    : !wallet.connected
    ? "Connect wallet"
    : earnedPgx <= 0
    ? "Nothing to claim"
    : `Claim ${fmtNum(earnedPgx, 4)} PGX`;

  return (
    <main className="container-app" style={{ paddingTop: 40, paddingBottom: 80, paddingLeft: 32, paddingRight: 32 }}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div className="col gap-8">
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0, letterSpacing: "-0.01em" }}>Rewards</h1>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>
            PGX staking rewards accrue from your share of protocol fee revenue. Claim them on-chain anytime.
          </p>
        </div>
      </div>

      {hasError && (
        <div
          style={{
            padding: "10px 16px",
            marginBottom: 14,
            borderRadius: 8,
            background: "color-mix(in oklch, var(--danger) 10%, var(--panel))",
            border: "1px solid color-mix(in oklch, var(--danger) 30%, var(--line))",
            fontSize: 13,
            color: "var(--danger)",
          }}
        >
          Failed to fetch on-chain data - your RPC may be rate-limited. Balances shown may be stale.
        </div>
      )}

      <div
        className="panel rewards-hero"
        style={{
          padding: 32,
          marginBottom: 20,
          background: "linear-gradient(160deg, color-mix(in oklch, var(--accent) 10%, var(--panel)), var(--panel) 70%)",
          borderColor: "color-mix(in oklch, var(--accent) 25%, var(--line))",
        }}
      >
        <div className="row rewards-hero-inner" style={{ justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div className="col gap-8">
            <span className="caps">Claimable staking rewards</span>
            <div className="row gap-12" style={{ alignItems: "baseline" }}>
              <span
                className="num rewards-hero-amount"
                style={{ fontSize: 56, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--accent)" }}
              >
                {showLoading ? "-" : fmtNum(earnedPgx, 4)}
              </span>
              <span style={{ fontSize: 18, color: "var(--text-2)" }}>PGX</span>
            </div>
            <div className="row gap-12" style={{ fontSize: 13 }}>
              <span className="muted">
                {wallet.connected ? `${fmtNum(stakedPgx)} PGX staked` : "Connect wallet to see your rewards"}
              </span>
            </div>
          </div>
          <div className="col gap-12" style={{ justifyContent: "center", minWidth: 260 }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={onClaim}
              disabled={(earnedPgx <= 0 && wallet.connected) || busy}
              style={{
                justifyContent: "center",
                padding: "16px 24px",
                opacity: (earnedPgx <= 0 && wallet.connected) || busy ? 0.5 : 1,
              }}
            >
              {claimLabel}
            </button>
            <div className="row gap-8" style={{ fontSize: 12, color: "var(--text-3)", justifyContent: "center" }}>
              <Icon.Shield size={12} />
              <span>On-chain claim via staking contract</span>
            </div>
          </div>
        </div>
      </div>

      <div className="panel" style={{ padding: 24 }}>
        <span className="caps">Claim history</span>
        <div style={{ padding: "28px 0", textAlign: "center" }}>
          <div style={{ fontSize: 14, color: "var(--text-2)" }}>Reward history is not available yet.</div>
          <div style={{ fontSize: 13, color: "var(--text-3)", marginTop: 6 }}>
            Per-claim history and earnings charts will appear here once the protocol analytics subgraph is connected.
          </div>
        </div>
      </div>
    </main>
  );
};
