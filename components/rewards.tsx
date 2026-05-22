"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { formatUnits } from "viem";
import { Icon } from "./icons";
import { useWallet } from "./wallet";
import { useToast } from "./toast";
import { fmtNum, fmtUsd } from "@/lib/format";
import { STAKING_ADDRESS, stakingAbi } from "@/lib/contracts";

const PGX_DECIMALS = 18;
const PGX_PRICE_USD = 0.4218;

type IllustrativeStream = {
  id: "trade" | "refer" | "quest";
  title: string;
  desc: string;
  amount: number;
  usd: number;
  epoch: string;
  icon: React.ReactNode;
};

const ILLUSTRATIVE_STREAMS: IllustrativeStream[] = [
  {
    id: "trade",
    title: "Trading rebates",
    desc: "0.02% rebate on 30d swap volume, paid in PGX.",
    amount: 128.44,
    usd: 54.18,
    epoch: "Last 7 days · illustrative",
    icon: <Icon.Swap />,
  },
  {
    id: "refer",
    title: "Referral bounty",
    desc: "3 wallets joined via your referral this month.",
    amount: 60.0,
    usd: 25.31,
    epoch: "April 2026 · illustrative",
    icon: <Icon.Gift />,
  },
  {
    id: "quest",
    title: "Ecosystem quest",
    desc: 'Completed: "Provide liquidity to PGX/ETH".',
    amount: 25.0,
    usd: 10.55,
    epoch: "Quest #18 · illustrative",
    icon: <Icon.Spark />,
  },
];

const REWARD_HISTORY = [
  { date: "Apr 14, 2026", kind: "Staking", amount: 842.1, tx: "0x7a19…08b2" },
  { date: "Apr 07, 2026", kind: "Staking", amount: 821.55, tx: "0x1def…42a7" },
  { date: "Apr 03, 2026", kind: "Trading rebate", amount: 214.83, tx: "0x9c21…5abc" },
  { date: "Mar 31, 2026", kind: "Staking", amount: 804.38, tx: "0x5fa8…bb11" },
  { date: "Mar 28, 2026", kind: "Quest #17", amount: 50.0, tx: "0xe012…3ff2" },
  { date: "Mar 24, 2026", kind: "Staking", amount: 799.15, tx: "0xa9c3…7712" },
];

type StreamId = "stake" | IllustrativeStream["id"];

export const RewardsPage = () => {
  const wallet = useWallet();
  const toast = useToast();
  const { address } = useAccount();

  const { data: readData, refetch } = useReadContracts({
    contracts: [
      { address: STAKING_ADDRESS, abi: stakingAbi, functionName: "earned", args: [address!] },
      { address: STAKING_ADDRESS, abi: stakingAbi, functionName: "balanceOf", args: [address!] },
    ],
    query: { enabled: Boolean(address), refetchInterval: 10_000 },
  });

  const earnedWei = readData?.[0]?.result as bigint | undefined;
  const stakedWei = readData?.[1]?.result as bigint | undefined;
  const earnedPgx = earnedWei ? Number(formatUnits(earnedWei, PGX_DECIMALS)) : 0;
  const stakedPgx = stakedWei ? Number(formatUnits(stakedWei, PGX_DECIMALS)) : 0;

  const [selected, setSelected] = useState<Set<StreamId>>(
    () => new Set<StreamId>(["stake", "trade", "refer", "quest"])
  );
  const [claimed, setClaimed] = useState<Set<StreamId>>(new Set());

  const stakingSelected = selected.has("stake") && earnedPgx > 0 && !claimed.has("stake");
  const activeIllustrative = ILLUSTRATIVE_STREAMS.filter((r) => !claimed.has(r.id));

  const totalPgx =
    (stakingSelected ? earnedPgx : 0) +
    activeIllustrative
      .filter((r) => selected.has(r.id))
      .reduce((s, r) => s + r.amount, 0);
  const totalUsd =
    (stakingSelected ? earnedPgx * PGX_PRICE_USD : 0) +
    activeIllustrative
      .filter((r) => selected.has(r.id))
      .reduce((s, r) => s + r.usd, 0);

  const allStreamCount = 1 + ILLUSTRATIVE_STREAMS.length;
  const activeCount = (earnedPgx > 0 && !claimed.has("stake") ? 1 : 0) + activeIllustrative.length;

  const toggle = (id: StreamId) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const selectAll = () => {
    const next = new Set<StreamId>();
    if (earnedPgx > 0 && !claimed.has("stake")) next.add("stake");
    activeIllustrative.forEach((r) => next.add(r.id));
    setSelected(next);
  };

  const { writeContract, data: txHash, isPending, reset: resetWrite } = useWriteContract();
  const { isLoading: mining, isSuccess: mined } = useWaitForTransactionReceipt({ hash: txHash });
  const busy = isPending || mining;

  useEffect(() => {
    if (mined) {
      setClaimed((c) => {
        const n = new Set(c);
        n.add("stake");
        return n;
      });
      toast({ title: "Staking rewards claimed", body: `${fmtNum(earnedPgx, 4)} PGX sent to wallet` });
      refetch();
      resetWrite();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mined]);

  const claim = () => {
    if (!wallet.connected) {
      wallet.open();
      return;
    }
    if (totalPgx === 0) return;

    const illustrativeToMark = activeIllustrative
      .filter((r) => selected.has(r.id))
      .map((r) => r.id);

    if (illustrativeToMark.length > 0) {
      setClaimed((c) => {
        const n = new Set(c);
        illustrativeToMark.forEach((id) => n.add(id));
        return n;
      });
      toast({
        title: "Off-chain streams marked claimed",
        body: "Trading/referral/quest streams are illustrative in this MVP",
      });
    }

    if (stakingSelected) {
      writeContract(
        {
          address: STAKING_ADDRESS,
          abi: stakingAbi,
          functionName: "claimRewards",
        },
        {
          onSuccess: () => toast({ title: "Claim submitted", body: `${fmtNum(earnedPgx, 4)} PGX pending` }),
          onError: (e) => toast({ title: "Claim failed", body: e.message, kind: "error" }),
        }
      );
    }
  };

  const claimButtonLabel = busy
    ? "Claiming…"
    : !wallet.connected
    ? "Connect wallet"
    : totalPgx === 0
    ? "Nothing to claim"
    : `Claim ${fmtNum(totalPgx, 2)} PGX`;

  const stakingStreamDisabled = earnedPgx <= 0 || claimed.has("stake");

  return (
    <main className="container-app" style={{ paddingTop: 40, paddingBottom: 80, paddingLeft: 32, paddingRight: 32 }}>
      <div
        className="row"
        style={{ justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}
      >
        <div className="col gap-8">
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0, letterSpacing: "-0.01em" }}>
            Rewards
          </h1>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>
            Claim everything you&apos;ve earned across the ecosystem. Staking rewards are settled on-chain;
            other streams are illustrative in this MVP.
          </p>
        </div>
      </div>

      <div
        className="panel rewards-hero"
        style={{
          padding: 32,
          marginBottom: 20,
          background:
            "linear-gradient(160deg, color-mix(in oklch, var(--accent) 10%, var(--panel)), var(--panel) 70%)",
          borderColor: "color-mix(in oklch, var(--accent) 25%, var(--line))",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          className="grid-bg"
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.2,
            maskImage: "radial-gradient(circle at 80% 50%, black 10%, transparent 70%)",
            WebkitMaskImage: "radial-gradient(circle at 80% 50%, black 10%, transparent 70%)",
          }}
        />
        <div
          className="row rewards-hero-inner"
          style={{ justifyContent: "space-between", position: "relative", gap: 24, flexWrap: "wrap" }}
        >
          <div className="col gap-8">
            <span className="caps">Total claimable</span>
            <div className="row gap-12" style={{ alignItems: "baseline" }}>
              <span
                className="num rewards-hero-amount"
                style={{
                  fontSize: 56,
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  color: "var(--accent)",
                }}
              >
                {fmtNum(totalPgx, 2)}
              </span>
              <span style={{ fontSize: 18, color: "var(--text-2)" }}>PGX</span>
            </div>
            <div className="row gap-12" style={{ fontSize: 13 }}>
              <span className="num muted">≈ {fmtUsd(totalUsd)}</span>
              <span className="muted">·</span>
              <span className="muted">
                {selected.size} of {allStreamCount} streams selected · {activeCount} active
              </span>
            </div>
          </div>
          <div className="col gap-12" style={{ justifyContent: "center", minWidth: 260 }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={claim}
              disabled={(totalPgx === 0 && wallet.connected) || busy}
              style={{
                justifyContent: "center",
                padding: "16px 24px",
                opacity: (totalPgx === 0 && wallet.connected) || busy ? 0.5 : 1,
              }}
            >
              {claimButtonLabel}
            </button>
            <div
              className="row gap-8"
              style={{ fontSize: 12, color: "var(--text-3)", justifyContent: "center" }}
            >
              <Icon.Shield size={12} />
              <span>
                {stakingSelected
                  ? "On-chain claim via staking contract"
                  : "No on-chain action required"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20 }}
        className="rewards-grid"
      >
        <div className="col gap-16">
          <div>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
              <span className="caps">Reward streams</span>
              <div className="row gap-8" style={{ fontSize: 12 }}>
                <button className="muted" onClick={selectAll}>
                  Select all
                </button>
                <span className="muted">·</span>
                <button className="muted" onClick={() => setSelected(new Set())}>
                  Clear
                </button>
              </div>
            </div>
            <div className="col gap-8">
              <StreamRow
                selected={selected.has("stake") && !claimed.has("stake")}
                claimed={claimed.has("stake")}
                disabled={stakingStreamDisabled}
                onToggle={() => !stakingStreamDisabled && toggle("stake")}
                icon={<Icon.Bolt />}
                title="Staking emissions"
                badge={<span className="chip accent" style={{ fontSize: 10 }}>On-chain</span>}
                desc="PGX emissions accruing every second from the staking contract."
                epoch={
                  wallet.connected
                    ? `${fmtNum(stakedPgx)} PGX staked · live`
                    : "Connect wallet to see live"
                }
                amount={earnedPgx}
                usd={earnedPgx * PGX_PRICE_USD}
              />

              {ILLUSTRATIVE_STREAMS.map((r) => {
                const isClaimed = claimed.has(r.id);
                const isSelected = selected.has(r.id);
                return (
                  <StreamRow
                    key={r.id}
                    selected={isSelected && !isClaimed}
                    claimed={isClaimed}
                    onToggle={() => !isClaimed && toggle(r.id)}
                    icon={r.icon}
                    title={r.title}
                    desc={r.desc}
                    epoch={r.epoch}
                    amount={r.amount}
                    usd={r.usd}
                  />
                );
              })}
            </div>
          </div>

          <div className="panel">
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
              <span className="caps">Claim history</span>
              <span className="muted" style={{ fontSize: 11, marginLeft: 8 }}>
                illustrative
              </span>
            </div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Source</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                    <th style={{ textAlign: "right" }}>Tx</th>
                  </tr>
                </thead>
                <tbody>
                  {REWARD_HISTORY.map((h, i) => (
                    <tr key={i}>
                      <td className="mono" style={{ color: "var(--text-2)" }}>
                        {h.date}
                      </td>
                      <td>{h.kind}</td>
                      <td style={{ textAlign: "right" }} className="num">
                        {fmtNum(h.amount, 2)} PGX
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <a
                          className="mono"
                          style={{ fontSize: 12, color: "var(--text-2)" }}
                          href="#"
                          onClick={(e) => e.preventDefault()}
                        >
                          {h.tx} <Icon.Ext />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col gap-16">
          <TierCard totalStaked={stakedPgx} />

          <div className="panel" style={{ padding: 20 }}>
            <div className="caps" style={{ marginBottom: 14 }}>
              Earnings · last 30 days
            </div>
            <div className="num" style={{ fontSize: 28, fontWeight: 500 }}>
              {fmtNum(4521.04, 2)} PGX
            </div>
            <div className="num" style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 16 }}>
              ≈ {fmtUsd(1907.08)} · illustrative
            </div>
            <EarningsChart />
            <div
              className="row"
              style={{
                justifyContent: "space-between",
                marginTop: 10,
                fontSize: 11,
                color: "var(--text-3)",
              }}
            >
              <span className="mono">Mar 19</span>
              <span className="mono">Today</span>
            </div>
          </div>

          <div className="panel" style={{ padding: 20 }}>
            <div className="caps" style={{ marginBottom: 10 }}>
              Ways to earn more
            </div>
            <div className="col gap-10">
              <TipRow
                icon={<Icon.Bolt size={14} />}
                title="Stake more PGX"
                desc="Share of pool scales your emissions every second."
              />
              <TipRow
                icon={<Icon.Swap size={14} />}
                title="Trade to earn"
                desc="0.02% rebate on weekly volume over $1K."
              />
              <TipRow
                icon={<Icon.Gift size={14} />}
                title="Refer a wallet"
                desc="20 PGX per new connected wallet."
              />
            </div>
          </div>
        </div>
      </div>

    </main>
  );
};

const StreamRow = ({
  selected,
  claimed,
  disabled,
  onToggle,
  icon,
  title,
  badge,
  desc,
  epoch,
  amount,
  usd,
}: {
  selected: boolean;
  claimed: boolean;
  disabled?: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
  title: string;
  badge?: React.ReactNode;
  desc: string;
  epoch: string;
  amount: number;
  usd: number;
}) => {
  const effectiveDisabled = claimed || disabled;
  return (
    <button
      onClick={onToggle}
      disabled={effectiveDisabled}
      className="row gap-16 stream-row"
      style={{
        padding: "16px 18px",
        background: claimed
          ? "var(--bg-2)"
          : selected
          ? "color-mix(in oklch, var(--accent) 6%, var(--panel))"
          : "var(--panel)",
        border:
          "1px solid " +
          (claimed
            ? "var(--line)"
            : selected
            ? "color-mix(in oklch, var(--accent) 40%, transparent)"
            : "var(--line)"),
        borderRadius: 12,
        textAlign: "left",
        opacity: claimed ? 0.55 : disabled ? 0.7 : 1,
        cursor: effectiveDisabled ? "default" : "pointer",
        transition: "background .15s, border-color .15s",
        width: "100%",
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: 4,
          border: "1.5px solid " + (selected ? "var(--accent)" : "var(--line-2)"),
          background: selected ? "var(--accent)" : "transparent",
          color: "var(--accent-ink)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {selected && <Icon.Check size={11} />}
      </span>
      <span
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: "color-mix(in oklch, var(--accent) 14%, transparent)",
          border: "1px solid color-mix(in oklch, var(--accent) 25%, transparent)",
          color: "var(--accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <div className="col gap-4" style={{ flex: 1, minWidth: 0 }}>
        <div className="row gap-8">
          <span style={{ fontSize: 14, fontWeight: 500 }}>{title}</span>
          {badge}
          {claimed && (
            <span className="chip" style={{ fontSize: 10, color: "var(--ok)" }}>
              <Icon.Check size={10} /> Claimed
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-3)" }}>{desc}</div>
        <div className="mono" style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
          {epoch}
        </div>
      </div>
      <div className="col gap-4" style={{ alignItems: "flex-end" }}>
        <span className="num" style={{ fontSize: 16, fontWeight: 500 }}>
          {fmtNum(amount, 2)}{" "}
          <span style={{ fontSize: 11, color: "var(--text-3)" }}>PGX</span>
        </span>
        <span className="num" style={{ fontSize: 11, color: "var(--text-3)" }}>
          ≈ {fmtUsd(usd)}
        </span>
      </div>
    </button>
  );
};

const TierCard = ({ totalStaked }: { totalStaked: number }) => {
  const tiers = [
    { name: "Bronze", min: 0, discount: "0%" },
    { name: "Silver", min: 10000, discount: "10%" },
    { name: "Gold", min: 50000, discount: "25%" },
    { name: "Prism", min: 100000, discount: "40%" },
  ];
  const currentIdx = Math.max(
    0,
    tiers.findIndex(
      (t, i) =>
        totalStaked >= t.min && (i === tiers.length - 1 || totalStaked < tiers[i + 1].min)
    )
  );
  const current = tiers[currentIdx];
  const next = tiers[currentIdx + 1];
  const progress = next ? (totalStaked - current.min) / (next.min - current.min) : 1;

  return (
    <div className="panel" style={{ padding: 20 }}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
        <span className="caps">Your tier</span>
        <span className="chip accent">{current.discount} fee discount</span>
      </div>
      <div className="row gap-12">
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 10,
            background: "color-mix(in oklch, var(--accent) 14%, transparent)",
            border: "1px solid color-mix(in oklch, var(--accent) 30%, transparent)",
            color: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon.Spark />
        </div>
        <div className="col gap-4">
          <div style={{ fontSize: 18, fontWeight: 600 }}>{current.name}</div>
          <div className="mono" style={{ fontSize: 12, color: "var(--text-3)" }}>
            {fmtNum(totalStaked)} PGX staked
          </div>
        </div>
      </div>
      {next && (
        <>
          <div className="hairline" style={{ margin: "16px 0" }} />
          <div className="col gap-8">
            <div className="row" style={{ justifyContent: "space-between", fontSize: 12 }}>
              <span className="muted">Next: {next.name}</span>
              <span className="mono">{fmtNum(Math.max(0, next.min - totalStaked))} PGX to go</span>
            </div>
            <div
              style={{
                height: 4,
                background: "var(--line)",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, Math.max(0, progress * 100))}%`,
                  height: "100%",
                  background: "var(--accent)",
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const EarningsChart = () => {
  const bars = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => {
        return 30 + Math.sin(i * 0.4) * 15 + i * 1.2 + (i % 7 === 0 ? 20 : 0);
      }),
    []
  );
  const max = Math.max(...bars);
  return (
    <div className="row" style={{ gap: 2, height: 80, alignItems: "flex-end" }}>
      {bars.map((h, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: `${(h / max) * 100}%`,
            background:
              i === bars.length - 1
                ? "var(--accent)"
                : "color-mix(in oklch, var(--accent) 35%, var(--line))",
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
};

const TipRow = ({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) => (
  <div className="row gap-12" style={{ padding: "10px 0" }}>
    <span
      style={{
        width: 28,
        height: 28,
        borderRadius: 6,
        background: "var(--bg-2)",
        border: "1px solid var(--line)",
        color: "var(--text-2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {icon}
    </span>
    <div className="col gap-4" style={{ flex: 1 }}>
      <div style={{ fontSize: 13, fontWeight: 500 }}>{title}</div>
      <div style={{ fontSize: 12, color: "var(--text-3)" }}>{desc}</div>
    </div>
    <Icon.Arrow size={12} dir="right" />
  </div>
);
