"use client";

import React, { useMemo, useState } from "react";
import { Icon, TokenIcon } from "./icons";
import { useWallet } from "./wallet";
import { useToast } from "./toast";
import { fmtNum } from "@/lib/format";
import {
  useStaking,
  useStakingActions,
  parsePgx,
  fmtPgx,
} from "@/lib/staking";
import { useTxQueue } from "@/lib/txqueue";

const SummaryCard = ({
  label,
  value,
  sub,
  accent,
  muted,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
  muted?: boolean;
}) => (
  <div
    className="panel"
    style={{
      padding: 16,
      background: accent ? "color-mix(in oklch, var(--accent) 8%, var(--panel))" : "var(--panel)",
      borderColor: accent ? "color-mix(in oklch, var(--accent) 30%, var(--line))" : "var(--line)",
    }}
  >
    <div className="caps">{label}</div>
    <div
      className="num"
      style={{
        fontSize: 22,
        fontWeight: 500,
        marginTop: 8,
        color: accent ? "var(--accent)" : muted ? "var(--text-2)" : "var(--text)",
      }}
    >
      {value}
    </div>
    <div className="num" style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>{sub}</div>
  </div>
);

const InlineStat = ({ label, value, tone }: { label: string; value: string; tone?: "accent" }) => (
  <div className="col gap-4">
    <div className="caps">{label}</div>
    <div
      className="num"
      style={{ fontSize: 14, fontWeight: 500, color: tone === "accent" ? "var(--accent)" : "var(--text)" }}
    >
      {value}
    </div>
  </div>
);

type Mode = "stake" | "unstake";

export const StakePage = () => {
  const wallet = useWallet();
  const toast = useToast();
  const [tab, setTab] = useState<Mode>("stake");
  const [amount, setAmount] = useState("");

  const { state, loading, hasError, refetch } = useStaking();
  const queue = useTxQueue();
  const { approve, stake, unstake, claim, busy } = useStakingActions(() => {
    // Approval mined → the queued stake fires and re-prompts the wallet.
    if (queue.advance()) return;
    refetch();
    setAmount("");
  });

  const pgxBal = fmtPgx(state.walletBalance);
  const stakedPgx = fmtPgx(state.staked);
  const earnedPgx = fmtPgx(state.earned);
  const globalStaked = fmtPgx(state.totalStaked);
  const lifetimeRewards = fmtPgx(state.totalRewardsDeposited);
  const paused = state.paused === true;

  // Show "-" while the first read is in flight rather than a misleading "0".
  const showLoading = loading && state.walletBalance === undefined;
  const fmtBal = (n: number, d = 4) => (showLoading ? "-" : fmtNum(n, d));

  const parsed = parseFloat(amount) || 0;
  const parsedWei = useMemo(() => parsePgx(amount), [amount]);

  const needsApproval =
    tab === "stake" &&
    parsedWei > 0n &&
    (state.allowance === undefined || state.allowance < parsedWei);

  const onStake = () => {
    const doStake = () =>
      stake(parsedWei, {
        onSuccess: () => toast({ title: "Stake submitted", body: `${fmtNum(parsed)} PGX` }),
        onError: (e) => { queue.clear(); toast({ title: "Stake failed", body: e.message, kind: "error" }); },
      });
    if (needsApproval) {
      queue.start([
        () =>
          approve(parsedWei, {
            onSuccess: () => toast({ title: "Approve submitted", body: "Staking follows automatically once it confirms" }),
            onError: (e) => { queue.clear(); toast({ title: "Approve failed", body: e.message, kind: "error" }); },
          }),
        doStake,
      ]);
    } else {
      doStake();
    }
  };

  const onUnstake = () =>
    unstake(parsedWei, {
      onSuccess: () => toast({ title: "Unstake submitted", body: `${fmtNum(parsed)} PGX` }),
      onError: (e) => toast({ title: "Unstake failed", body: e.message, kind: "error" }),
    });

  const onClaim = () =>
    claim({
      onSuccess: () => toast({ title: "Claim submitted", body: `${fmtNum(earnedPgx)} PGX` }),
      onError: (e) => toast({ title: "Claim failed", body: e.message, kind: "error" }),
    });

  const setPct = (frac: number) => {
    const base = tab === "stake" ? pgxBal : stakedPgx;
    setAmount((base * frac).toString());
  };

  const stakeDisabled = !wallet.connected || paused || parsed <= 0 || parsed > pgxBal || busy;
  const unstakeDisabled = !wallet.connected || parsed <= 0 || parsed > stakedPgx || busy;

  return (
    <main className="container-app" style={{ paddingTop: 40, paddingBottom: 80, paddingLeft: 32, paddingRight: 32, minWidth: 0, overflow: "hidden" }}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div className="col gap-8">
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0, letterSpacing: "-0.01em" }}>Staking</h1>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>
            Stake PGX to earn a proportional share of protocol fee revenue. No lock - unstake or claim anytime.
          </p>
        </div>
        <div className="row gap-16 stake-header-stats">
          <InlineStat label="Global PGX staked" value={showLoading ? "-" : fmtNum(globalStaked)} />
          <InlineStat label="Lifetime rewards" value={showLoading ? "-" : `${fmtNum(lifetimeRewards)} PGX`} />
          <InlineStat label="Your share" value={globalStaked > 0 ? `${((stakedPgx / globalStaked) * 100).toFixed(4)}%` : "-"} tone="accent" />
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
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 16 }}>⚠</span>
          <span>Failed to fetch on-chain data - your RPC may be rate-limited. Balances shown may be stale.</span>
        </div>
      )}

      {paused && (
        <div
          style={{
            padding: "10px 16px",
            marginBottom: 14,
            borderRadius: 8,
            background: "color-mix(in oklch, var(--accent) 8%, var(--panel))",
            border: "1px solid color-mix(in oklch, var(--accent) 30%, var(--line))",
            fontSize: 13,
            color: "var(--text-2)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 16 }}>⏸</span>
          <span>New staking is paused. You can still unstake and claim rewards.</span>
        </div>
      )}

      <div className="stake-summary" style={{ display: "grid", gap: 12, marginBottom: 20 }}>
        <SummaryCard label="Your staked" value={`${fmtBal(stakedPgx)} PGX`} sub={showLoading ? "-" : "Principal"} />
        <SummaryCard label="Pending rewards" value={`${fmtBal(earnedPgx, 4)} PGX`} sub={showLoading ? "-" : "Claimable"} accent />
        <SummaryCard label="Wallet PGX" value={`${fmtBal(pgxBal)} PGX`} sub={showLoading ? "-" : "Available to stake"} />
        <SummaryCard
          label="Share of pool"
          value={globalStaked > 0 ? `${((stakedPgx / globalStaked) * 100).toFixed(4)}%` : "-"}
          sub={globalStaked > 0 ? `${fmtNum(globalStaked)} total staked` : "No stake yet"}
          muted
        />
      </div>

      <div className="stake-grid" style={{ display: "grid", gap: 20 }}>
        <div className="panel" style={{ padding: 20, alignSelf: "start" }}>
          <div className="tabs" style={{ marginBottom: 16, width: "100%" }}>
            <button className={tab === "stake" ? "active" : ""} onClick={() => { setTab("stake"); setAmount(""); }} style={{ flex: 1 }}>
              Stake
            </button>
            <button className={tab === "unstake" ? "active" : ""} onClick={() => { setTab("unstake"); setAmount(""); }} style={{ flex: 1 }}>
              Unstake
            </button>
          </div>

          <div
            style={{
              background: "var(--bg-2)",
              border: "1px solid var(--line)",
              borderRadius: 10,
              padding: 16,
              marginBottom: 14,
            }}
          >
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>
                {tab === "stake" ? "Amount to stake" : "Amount to unstake"}
              </span>
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>
                {tab === "stake" ? "Wallet" : "Staked"}:{" "}
                <span className="mono">{fmtNum(tab === "stake" ? pgxBal : stakedPgx)}</span>
              </span>
            </div>
            <div className="row gap-12">
              <input
                className="num"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="0"
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: 28,
                  fontWeight: 500,
                  color: "var(--text)",
                  padding: 0,
                  minWidth: 0,
                }}
              />
              <div className="row gap-8">
                <TokenIcon symbol="PGX" size="sm" />
                <span style={{ fontSize: 14, fontWeight: 600 }}>PGX</span>
              </div>
            </div>
            <div className="row" style={{ justifyContent: "flex-end", marginTop: 8, fontSize: 12, color: "var(--text-3)" }}>
              <div className="row gap-6">
                {[0.25, 0.5, 1].map((f) => (
                  <button
                    key={f}
                    className="chip"
                    style={{
                      fontSize: 10,
                      padding: "1px 8px",
                      color: "var(--accent)",
                      borderColor: "color-mix(in oklch, var(--accent) 30%, transparent)",
                    }}
                    onClick={() => setPct(f)}
                  >
                    {f === 1 ? "MAX" : `${f * 100}%`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {tab === "stake" ? (
            <>
              <div style={{ background: "var(--bg-2)", borderRadius: 8, padding: 14, border: "1px solid var(--line)" }}>
                <div className="col gap-8" style={{ fontSize: 13 }}>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <span className="muted">Rewards</span>
                    <span className="mono">Pro-rata share of fees</span>
                  </div>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <span className="muted">Lock</span>
                    <span className="mono">None · unstake anytime</span>
                  </div>
                </div>
              </div>
              <button
                className="btn btn-primary btn-lg"
                disabled={stakeDisabled}
                onClick={onStake}
                style={{ width: "100%", marginTop: 14, justifyContent: "center", opacity: stakeDisabled ? 0.5 : 1 }}
              >
                {!wallet.connected
                  ? "Connect wallet"
                  : paused
                  ? "Staking paused"
                  : parsed === 0
                  ? "Enter an amount"
                  : parsed > pgxBal
                  ? "Insufficient PGX"
                  : busy
                  ? needsApproval ? "Approving…" : "Staking…"
                  : needsApproval
                  ? `Approve & stake ${fmtNum(parsed)} PGX`
                  : `Stake ${fmtNum(parsed)} PGX`}
              </button>
            </>
          ) : (
            <>
              <div style={{ background: "var(--bg-2)", borderRadius: 8, padding: 14, border: "1px solid var(--line)" }}>
                <div className="col gap-8" style={{ fontSize: 13 }}>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <span className="muted">Currently staked</span>
                    <span className="mono">{fmtNum(stakedPgx)} PGX</span>
                  </div>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <span className="muted">Pending rewards</span>
                    <span className="mono">{fmtNum(earnedPgx, 4)} PGX</span>
                  </div>
                </div>
              </div>
              <button
                className="btn btn-primary btn-lg"
                disabled={unstakeDisabled}
                onClick={onUnstake}
                style={{ width: "100%", marginTop: 14, justifyContent: "center", opacity: unstakeDisabled ? 0.5 : 1 }}
              >
                {!wallet.connected
                  ? "Connect wallet"
                  : parsed === 0
                  ? "Enter an amount"
                  : parsed > stakedPgx
                  ? "Exceeds staked"
                  : busy
                  ? "Unstaking…"
                  : `Unstake ${fmtNum(parsed)} PGX`}
              </button>
            </>
          )}
        </div>

        <div className="col gap-16" style={{ minWidth: 0 }}>
          <div className="panel">
            <div
              className="row"
              style={{
                padding: "16px 20px",
                justifyContent: "space-between",
                borderBottom: "1px solid var(--line)",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div className="col gap-4">
                <div style={{ fontSize: 15, fontWeight: 600 }}>Your position</div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {stakedPgx > 0 ? `${fmtNum(earnedPgx, 4)} PGX claimable` : "Stake PGX to start earning"}
                </div>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={onClaim}
                disabled={earnedPgx === 0 || busy}
                style={{ opacity: earnedPgx === 0 || busy ? 0.5 : 1 }}
              >
                <Icon.Gift size={14} /> Claim rewards
              </button>
            </div>
            {stakedPgx === 0 ? (
              <div style={{ padding: 60, textAlign: "center" }}>
                <div style={{ fontSize: 14, color: "var(--text-2)" }}>No stake position yet.</div>
                <div style={{ fontSize: 13, color: "var(--text-3)", marginTop: 6 }}>
                  Rewards accrue from protocol fees, distributed proportionally to stakers.
                </div>
              </div>
            ) : (
              <div style={{ padding: 20 }}>
                <div className="row" style={{ justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div className="row gap-12">
                    <TokenIcon symbol="PGX" />
                    <div className="col gap-4">
                      <div className="num" style={{ fontSize: 16, fontWeight: 500 }}>{fmtNum(stakedPgx)} PGX</div>
                      <div className="row gap-8" style={{ fontSize: 12, color: "var(--text-3)" }}>
                        <span>Flexible</span>
                        <span>·</span>
                        <span>No lock</span>
                      </div>
                    </div>
                  </div>
                  <div className="col gap-4" style={{ alignItems: "flex-end" }}>
                    <span className="caps">Earned</span>
                    <span className="num" style={{ fontSize: 14, fontWeight: 500, color: "var(--accent)" }}>
                      {fmtNum(earnedPgx, 4)} PGX
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div
              className="row gap-8"
              style={{
                padding: "12px 20px",
                borderTop: "1px solid var(--line)",
                fontSize: 12,
                color: "var(--text-3)",
              }}
            >
              <Icon.Shield size={12} />
              <span>Rewards are your pro-rata share of protocol fees. Claim on-chain anytime - no lock, no schedule.</span>
            </div>
          </div>

          <div className="panel" style={{ padding: 20 }}>
            <span className="caps">Pool</span>
            <div className="row stake-emissions-footer" style={{ justifyContent: "space-between", marginTop: 14, fontSize: 12, flexWrap: "wrap", gap: 12 }}>
              <div className="col gap-4">
                <span className="muted">Global staked</span>
                <span className="mono">{showLoading ? "-" : `${fmtNum(globalStaked)} PGX`}</span>
              </div>
              <div className="col gap-4" style={{ alignItems: "center" }}>
                <span className="muted">Lifetime rewards</span>
                <span className="mono">{showLoading ? "-" : `${fmtNum(lifetimeRewards)} PGX`}</span>
              </div>
              <div className="col gap-4" style={{ alignItems: "flex-end", minWidth: 0 }}>
                <span className="muted">Your share</span>
                <span className="mono">{globalStaked > 0 ? `${((stakedPgx / globalStaked) * 100).toFixed(4)}%` : "-"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
