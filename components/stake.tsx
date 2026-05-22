"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { Icon, TokenIcon } from "./icons";
import { useWallet } from "./wallet";
import { useToast } from "./toast";
import { fmtNum, fmtUsd } from "@/lib/format";
import { PGX_ADDRESS, STAKING_ADDRESS, erc20Abi, stakingAbi } from "@/lib/contracts";

const PGX_DECIMALS = 18;
const PGX_PRICE_USD = 0.4218; // display only

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

const EmissionsChart = () => {
  const bars = Array.from({ length: 24 }, (_, i) => {
    const h = 40 + Math.sin(i * 0.5) * 15 + Math.cos(i * 0.3) * 10 + i / 2;
    return Math.max(20, Math.min(80, h));
  });
  return (
    <div className="row" style={{ gap: 3, height: 80, alignItems: "flex-end" }}>
      {bars.map((h, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: `${h.toFixed(2)}%`,
            background: i === 12 ? "var(--accent)" : i < 12 ? "var(--line-2)" : "var(--line)",
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
};

type Mode = "stake" | "unstake";

export const StakePage = () => {
  const wallet = useWallet();
  const toast = useToast();
  const { address } = useAccount();
  const [tab, setTab] = useState<Mode>("stake");
  const [amount, setAmount] = useState("");

  const { data: readData, refetch, error: readError, status: readStatus } = useReadContracts({
    contracts: [
      { address: PGX_ADDRESS, abi: erc20Abi, functionName: "balanceOf", args: [address!] },
      { address: PGX_ADDRESS, abi: erc20Abi, functionName: "allowance", args: [address!, STAKING_ADDRESS] },
      { address: STAKING_ADDRESS, abi: stakingAbi, functionName: "balanceOf", args: [address!] },
      { address: STAKING_ADDRESS, abi: stakingAbi, functionName: "earned", args: [address!] },
      { address: STAKING_ADDRESS, abi: stakingAbi, functionName: "totalStaked" },
      { address: STAKING_ADDRESS, abi: stakingAbi, functionName: "rewardRate" },
      { address: STAKING_ADDRESS, abi: stakingAbi, functionName: "rewardBalance" },
    ],
    query: { enabled: Boolean(address), refetchInterval: 10_000 },
  });

  const { data: globalTotalStakedFallback } = useReadContract({
    address: STAKING_ADDRESS,
    abi: stakingAbi,
    functionName: "totalStaked",
    query: { enabled: !address, refetchInterval: 15_000 },
  });

  // Debug: log contract read results to identify RPC / contract failures
  useEffect(() => {
    if (address && readData) {
      const labels = ["PGX.balanceOf", "PGX.allowance", "Staking.balanceOf", "Staking.earned", "totalStaked", "rewardRate", "rewardBalance"];
      readData.forEach((r, i) => {
        if (r.status === "failure") {
          console.error(`[Stake] ${labels[i]} FAILED:`, r.error);
        }
      });
      console.log("[Stake] readData:", readData.map((r, i) => `${labels[i]}=${r.status === "success" ? String(r.result) : "ERR"}`).join(", "));
    }
    if (readError) {
      console.error("[Stake] useReadContracts top-level error:", readError);
    }
  }, [readData, readError, address]);

  const balance = readData?.[0]?.status === "success" ? (readData[0].result as bigint) : undefined;
  const allowance = readData?.[1]?.status === "success" ? (readData[1].result as bigint) : undefined;
  const staked = readData?.[2]?.status === "success" ? (readData[2].result as bigint) : undefined;
  const earnedWei = readData?.[3]?.status === "success" ? (readData[3].result as bigint) : undefined;
  const totalStakedWei = (readData?.[4]?.status === "success" ? (readData[4].result as bigint) : undefined) ?? globalTotalStakedFallback;
  const rewardRate = readData?.[5]?.status === "success" ? (readData[5].result as bigint) : undefined;

  // Detect whether contract reads are still loading or have failed
  const dataLoading = Boolean(address) && readStatus === "pending";
  const hasContractError = Boolean(address) && readData?.some((r) => r.status === "failure");

  const pgxBal = balance !== undefined ? Number(formatUnits(balance, PGX_DECIMALS)) : 0;
  const stakedPgx = staked !== undefined ? Number(formatUnits(staked, PGX_DECIMALS)) : 0;
  const earnedPgx = earnedWei !== undefined ? Number(formatUnits(earnedWei, PGX_DECIMALS)) : 0;
  const globalStaked = totalStakedWei ? Number(formatUnits(totalStakedWei, PGX_DECIMALS)) : 0;

  // Display helpers - show "-" while loading instead of a misleading "0"
  const showLoading = dataLoading && balance === undefined;
  const fmtBal = (n: number, d = 4) => (showLoading ? "-" : fmtNum(n, d));

  const apr = useMemo(() => {
    if (!rewardRate || !totalStakedWei || totalStakedWei === 0n) return 0;
    const rate = Number(formatUnits(rewardRate, PGX_DECIMALS));
    const total = Number(formatUnits(totalStakedWei, PGX_DECIMALS));
    if (total === 0) return 0;
    return (rate * 31_536_000 * 100) / total;
  }, [rewardRate, totalStakedWei]);

  const parsed = parseFloat(amount) || 0;
  const parsedWei = useMemo(() => {
    if (!amount || Number.isNaN(parsed)) return 0n;
    try {
      return parseUnits(amount, PGX_DECIMALS);
    } catch {
      return 0n;
    }
  }, [amount, parsed]);

  const needsApproval =
    tab === "stake" && parsedWei > 0n && (allowance === undefined || allowance < parsedWei);

  const projectedAnnual = parsed * (apr / 100);
  const projectedDaily = projectedAnnual / 365;

  const { writeContract, data: txHash, isPending, reset: resetWrite } = useWriteContract();
  const { isLoading: mining, isSuccess: mined } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (mined) {
      refetch();
      setAmount("");
      resetWrite();
    }
  }, [mined, refetch, resetWrite]);

  const busy = isPending || mining;

  const onApprove = () => {
    if (!parsedWei) return;
    writeContract(
      {
        address: PGX_ADDRESS,
        abi: erc20Abi,
        functionName: "approve",
        args: [STAKING_ADDRESS, parsedWei],
      },
      {
        onSuccess: () => toast({ title: "Approve submitted", body: "Confirm in wallet to authorize staking" }),
        onError: (e) => toast({ title: "Approve failed", body: e.message, kind: "error" }),
      }
    );
  };

  const onStake = () => {
    if (!parsedWei) return;
    writeContract(
      {
        address: STAKING_ADDRESS,
        abi: stakingAbi,
        functionName: "stake",
        args: [parsedWei],
      },
      {
        onSuccess: () => toast({ title: "Stake submitted", body: `${fmtNum(parsed)} PGX` }),
        onError: (e) => toast({ title: "Stake failed", body: e.message, kind: "error" }),
      }
    );
  };

  const onWithdraw = () => {
    if (!parsedWei) return;
    writeContract(
      {
        address: STAKING_ADDRESS,
        abi: stakingAbi,
        functionName: "withdraw",
        args: [parsedWei],
      },
      {
        onSuccess: () => toast({ title: "Withdraw submitted", body: `${fmtNum(parsed)} PGX` }),
        onError: (e) => toast({ title: "Withdraw failed", body: e.message, kind: "error" }),
      }
    );
  };

  const onClaim = () => {
    writeContract(
      {
        address: STAKING_ADDRESS,
        abi: stakingAbi,
        functionName: "claimRewards",
      },
      {
        onSuccess: () => toast({ title: "Claim submitted", body: `${fmtNum(earnedPgx)} PGX pending` }),
        onError: (e) => toast({ title: "Claim failed", body: e.message, kind: "error" }),
      }
    );
  };

  const onEmergency = () => {
    writeContract(
      {
        address: STAKING_ADDRESS,
        abi: stakingAbi,
        functionName: "emergencyWithdraw",
      },
      {
        onSuccess: () => toast({ title: "Emergency withdraw submitted", body: "Forfeiting pending rewards" }),
        onError: (e) => toast({ title: "Emergency withdraw failed", body: e.message, kind: "error" }),
      }
    );
  };

  const setPct = (frac: number) => {
    const base = tab === "stake" ? pgxBal : stakedPgx;
    setAmount((base * frac).toString());
  };

  const stakeDisabled = !wallet.connected || parsed <= 0 || parsed > pgxBal || busy;
  const withdrawDisabled = !wallet.connected || parsed <= 0 || parsed > stakedPgx || busy;

  return (
    <main className="container-app" style={{ paddingTop: 40, paddingBottom: 80, paddingLeft: 32, paddingRight: 32, minWidth: 0, overflow: "hidden" }}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div className="col gap-8">
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0, letterSpacing: "-0.01em" }}>Staking</h1>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>
            Stake PGX into the on-chain reward pool. Rewards accrue every second and can be claimed anytime.
          </p>
        </div>
        <div className="row gap-16 stake-header-stats">
          <InlineStat label="Live APR" value={apr > 0 ? `${apr.toFixed(2)}%` : "-"} tone="accent" />
          <InlineStat label="Global PGX staked" value={fmtNum(globalStaked)} />
          <InlineStat label="Reward rate / s" value={rewardRate ? fmtNum(Number(formatUnits(rewardRate, PGX_DECIMALS))) : "-"} />
        </div>
      </div>

      {hasContractError && (
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
          <span>
            Failed to fetch on-chain data - your RPC may be rate-limited. Balances shown may be stale.
            Check the browser console for details.
          </span>
        </div>
      )}

      <div
        className="stake-summary"
        style={{ display: "grid", gap: 12, marginBottom: 20 }}
      >
        <SummaryCard
          label="Your staked"
          value={`${fmtBal(stakedPgx)} PGX`}
          sub={showLoading ? "-" : `≈ ${fmtUsd(stakedPgx * PGX_PRICE_USD)}`}
        />
        <SummaryCard
          label="Pending rewards"
          value={`${fmtBal(earnedPgx, 4)} PGX`}
          sub={showLoading ? "-" : `≈ ${fmtUsd(earnedPgx * PGX_PRICE_USD)}`}
          accent
        />
        <SummaryCard
          label="Wallet PGX"
          value={`${fmtBal(pgxBal)} PGX`}
          sub={showLoading ? "-" : `≈ ${fmtUsd(pgxBal * PGX_PRICE_USD)}`}
        />
        <SummaryCard
          label="Share of pool"
          value={globalStaked > 0 ? `${((stakedPgx / globalStaked) * 100).toFixed(4)}%` : "-"}
          sub={globalStaked > 0 ? `${fmtNum(globalStaked)} total staked` : "No stake yet"}
          muted
        />
      </div>

      <div
        className="stake-grid"
        style={{ display: "grid", gap: 20 }}
      >
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
            <div
              className="row"
              style={{ justifyContent: "space-between", marginTop: 8, fontSize: 12, color: "var(--text-3)" }}
            >
              <span className="mono">≈ ${fmtNum(parsed * PGX_PRICE_USD, 2)}</span>
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
                <div className="col gap-8">
                  <div className="row" style={{ justifyContent: "space-between", fontSize: 13 }}>
                    <span className="muted">Est. daily rewards</span>
                    <span className="mono">{fmtNum(projectedDaily, 4)} PGX</span>
                  </div>
                  <div className="row" style={{ justifyContent: "space-between", fontSize: 13 }}>
                    <span className="muted">Est. annual rewards</span>
                    <span className="mono">{fmtNum(projectedAnnual, 2)} PGX</span>
                  </div>
                  <div className="row" style={{ justifyContent: "space-between", fontSize: 13 }}>
                    <span className="muted">Unlocks</span>
                    <span className="mono">Anytime · Flexible</span>
                  </div>
                </div>
              </div>
              {needsApproval ? (
                <button
                  className="btn btn-primary btn-lg"
                  disabled={stakeDisabled}
                  onClick={onApprove}
                  style={{
                    width: "100%",
                    marginTop: 14,
                    justifyContent: "center",
                    opacity: stakeDisabled ? 0.5 : 1,
                  }}
                >
                  {!wallet.connected
                    ? "Connect wallet"
                    : parsed === 0
                    ? "Enter an amount"
                    : parsed > pgxBal
                    ? "Insufficient PGX"
                    : busy
                    ? "Approving…"
                    : `Approve ${fmtNum(parsed)} PGX`}
                </button>
              ) : (
                <button
                  className="btn btn-primary btn-lg"
                  disabled={stakeDisabled}
                  onClick={onStake}
                  style={{
                    width: "100%",
                    marginTop: 14,
                    justifyContent: "center",
                    opacity: stakeDisabled ? 0.5 : 1,
                  }}
                >
                  {!wallet.connected
                    ? "Connect wallet"
                    : parsed === 0
                    ? "Enter an amount"
                    : parsed > pgxBal
                    ? "Insufficient PGX"
                    : busy
                    ? "Staking…"
                    : `Stake ${fmtNum(parsed)} PGX`}
                </button>
              )}
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
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <span className="muted">Mode</span>
                    <span className="mono">Flexible · no lock</span>
                  </div>
                </div>
              </div>
              <button
                className="btn btn-primary btn-lg"
                disabled={withdrawDisabled}
                onClick={onWithdraw}
                style={{
                  width: "100%",
                  marginTop: 14,
                  justifyContent: "center",
                  opacity: withdrawDisabled ? 0.5 : 1,
                }}
              >
                {!wallet.connected
                  ? "Connect wallet"
                  : parsed === 0
                  ? "Enter an amount"
                  : parsed > stakedPgx
                  ? "Exceeds staked"
                  : busy
                  ? "Withdrawing…"
                  : `Withdraw ${fmtNum(parsed)} PGX`}
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={onEmergency}
                disabled={busy || stakedPgx === 0}
                style={{
                  width: "100%",
                  marginTop: 8,
                  justifyContent: "center",
                  color: "var(--danger)",
                  borderColor: "color-mix(in oklch, var(--danger) 35%, transparent)",
                  opacity: busy || stakedPgx === 0 ? 0.5 : 1,
                }}
              >
                Emergency withdraw (forfeits rewards)
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
                  Flexible staking. Accrues continuously from the on-chain reward pool.
                </div>
              </div>
            ) : (
              <div style={{ padding: 20, borderBottom: "1px solid var(--line)" }}>
                <div
                  className="row"
                  style={{ justifyContent: "space-between", marginBottom: 12, gap: 12, flexWrap: "wrap" }}
                >
                  <div className="row gap-12">
                    <TokenIcon symbol="PGX" />
                    <div className="col gap-4">
                      <div className="num" style={{ fontSize: 16, fontWeight: 500 }}>
                        {fmtNum(stakedPgx)} PGX
                      </div>
                      <div className="row gap-8" style={{ fontSize: 12, color: "var(--text-3)" }}>
                        <span>Flexible</span>
                        <span>·</span>
                        <span className="mono" style={{ color: "var(--accent)" }}>{apr.toFixed(2)}% APR</span>
                      </div>
                    </div>
                  </div>
                  <div className="col gap-4" style={{ alignItems: "flex-end" }}>
                    <span className="caps">Earned</span>
                    <span
                      className="num"
                      style={{ fontSize: 14, fontWeight: 500, color: "var(--accent)" }}
                    >
                      {fmtNum(earnedPgx, 4)} PGX
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="panel" style={{ padding: 20, overflow: "hidden" }}>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
              <div className="col gap-4">
                <span className="caps">Emissions schedule</span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>
                  Current epoch · {rewardRate && rewardRate > 0n ? "Active" : "Idle"}
                </span>
              </div>
              <div className="chip accent">
                <span className="dot" style={{ background: "var(--accent)" }} />
                <span>{rewardRate && rewardRate > 0n ? "Emitting" : "Awaiting owner"}</span>
              </div>
            </div>
            <EmissionsChart />
            <div className="row stake-emissions-footer" style={{ justifyContent: "space-between", marginTop: 14, fontSize: 12, flexWrap: "wrap", gap: 12 }}>
              <div className="col gap-4">
                <span className="muted">Reward rate / s</span>
                <span className="mono">
                  {rewardRate ? fmtNum(Number(formatUnits(rewardRate, PGX_DECIMALS)), 4) : "0"} PGX
                </span>
              </div>
              <div className="col gap-4" style={{ alignItems: "center" }}>
                <span className="muted">Global staked</span>
                <span className="mono">{fmtNum(globalStaked)} PGX</span>
              </div>
              <div className="col gap-4" style={{ alignItems: "flex-end", minWidth: 0 }}>
                <span className="muted">Your share</span>
                <span className="mono">
                  {globalStaked > 0 ? ((stakedPgx / globalStaked) * 100).toFixed(4) + "%" : "-"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </main>
  );
};
