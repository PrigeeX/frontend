"use client";

// Liquidity Management UI (FE-16..23).
//   <PoolListPage>  - all the wallet's LP positions, with empty / loading /
//                     not-configured states.
//   <AddLiquidityPage> - the add-liquidity flow: pair + fee tier, range presets
//                     and a draggable depth chart, deposit amounts, and mint.

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAccount, useReadContracts } from "wagmi";
import { Icon } from "./icons";
import { useWallet } from "./wallet";
import { useToast } from "./toast";
import { fmtNum } from "@/lib/format";
import { erc20Abi } from "@/lib/contracts";
import { dexConfigured, v2Configured, DEX } from "@/lib/dex";
import { PositionCard } from "./liquidity/PositionCard";
import { RangeChart, type DepthBar } from "./liquidity/RangeChart";
import { AddLiquidityV2, V2Positions } from "./liquidity/v2";
import {
  usePositions,
  usePool,
  useLiquidityActions,
  DEX_TOKENS,
  FeeAmount,
  Position,
  priceToTick,
  tickToPriceNum,
  TickMath,
  type PositionInfo,
} from "@/lib/liquidity";
import { Token } from "@uniswap/sdk-core";

const FEE_OPTIONS: { fee: FeeAmount; label: string; hint: string }[] = [
  { fee: FeeAmount.LOW, label: "0.05%", hint: "Stable pairs" },
  { fee: FeeAmount.MEDIUM, label: "0.30%", hint: "Most pairs" },
  { fee: FeeAmount.HIGH, label: "1.00%", hint: "Exotic pairs" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Positions list
// ─────────────────────────────────────────────────────────────────────────────

export function PoolListPage() {
  const wallet = useWallet();
  const { positions, loading } = usePositions();
  const configured = dexConfigured();

  return (
    <main className="container-app" style={{ paddingTop: 40, paddingBottom: 80, paddingLeft: 32, paddingRight: 32 }}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div className="col gap-8">
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0, letterSpacing: "-0.01em" }}>Liquidity</h1>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>
            Provide concentrated liquidity and earn fees on every swap that trades through your range.
          </p>
        </div>
        <Link className="btn btn-primary" href="/pool/new" style={{ alignSelf: "center" }}>
          <Icon.Plus size={14} /> New position
        </Link>
      </div>

      {!configured ? (
        <EmptyState
          title="Liquidity not configured"
          body="The V3 AMM addresses are not set for this deployment. Fill them in packages/dex-config.ts to enable liquidity."
        />
      ) : !wallet.connected ? (
        <EmptyState title="Connect your wallet" body="Connect to view and manage your liquidity positions." cta={<button className="btn btn-primary" onClick={wallet.open}>Connect wallet</button>} />
      ) : loading ? (
        <div className="pool-grid" style={{ display: "grid", gap: 16 }}>
          {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : positions.length === 0 ? (
        <EmptyState
          title="No concentrated positions yet"
          body="You have no V3 positions. Open one to earn fees on a chosen price range, or add a classic V2 position below."
          cta={<Link className="btn btn-primary" href="/pool/new"><Icon.Plus size={14} /> New position</Link>}
        />
      ) : (
        <div className="pool-grid" style={{ display: "grid", gap: 16 }}>
          {positions.map((p) => (
            <PositionCard key={p.tokenId.toString()} p={p} href={`/pool/${p.tokenId.toString()}`} />
          ))}
        </div>
      )}

      {v2Configured() && <V2Positions />}
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Add liquidity
// ─────────────────────────────────────────────────────────────────────────────

type Preset = "full" | "safe" | "concentrated" | "custom";

// Wrapper that lets the user pick the AMM the new position lives in: concentrated
// (V3) or classic constant-product (V2). The two bodies are mutually exclusive so
// only the selected one mounts its on-chain reads.
export function AddLiquidityPage() {
  const [version, setVersion] = useState<"v3" | "v2">("v3");
  const v2 = v2Configured();

  return (
    <main className="container-app" style={{ paddingTop: 40, paddingBottom: 80, paddingLeft: 32, paddingRight: 32 }}>
      <div className="row gap-12" style={{ marginBottom: 18, alignItems: "center" }}>
        <Link href="/pool" className="btn btn-ghost btn-sm" style={{ padding: 8 }}><Icon.Arrow dir="left" size={14} /></Link>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>New position</h1>
      </div>

      {v2 && (
        <div className="tabs" style={{ marginBottom: 20 }}>
          <button className={version === "v3" ? "active" : ""} onClick={() => setVersion("v3")}>Concentrated · V3</button>
          <button className={version === "v2" ? "active" : ""} onClick={() => setVersion("v2")}>Classic · V2</button>
        </div>
      )}

      {version === "v2" && v2 ? <AddLiquidityV2 /> : <AddLiquidityV3 />}
    </main>
  );
}

function AddLiquidityV3() {
  const wallet = useWallet();
  const toast = useToast();
  const { address } = useAccount();

  const [base, setBase] = useState<Token>(DEX_TOKENS[0]);
  const [quote, setQuote] = useState<Token>(DEX_TOKENS[1]);
  const [fee, setFee] = useState<FeeAmount>(FeeAmount.MEDIUM);
  const [preset, setPreset] = useState<Preset>("safe");
  const [amount0, setAmount0] = useState("");
  const [slippage] = useState(0.5);

  // Order tokens canonically (token0 < token1) so SDK math lines up.
  const [t0, t1] = useMemo(
    () => (base.sortsBefore(quote) ? [base, quote] : [quote, base]),
    [base, quote],
  );
  const { pool, exists } = usePool(t0, t1, fee);

  const currentPrice = pool ? Number(pool.token0Price.toSignificant(8)) : undefined;

  // Selected range, kept as ticks (snapped to spacing).
  const [range, setRange] = useState<{ lower: number; upper: number } | null>(null);

  // Apply a preset whenever pool/fee/preset changes (unless user is dragging custom).
  useEffect(() => {
    if (!pool || currentPrice === undefined || preset === "custom") return;
    const spans: Record<Exclude<Preset, "custom">, number> = { full: 1, safe: 0.1, concentrated: 0.02 };
    const next =
      preset === "full"
        ? { lower: nearestFullTick(fee, true), upper: nearestFullTick(fee, false) }
        : {
            lower: priceToTick(currentPrice * (1 - spans[preset]), t0, t1, fee),
            upper: priceToTick(currentPrice * (1 + spans[preset]), t0, t1, fee),
          };
    // Deriving the range from the chosen preset is the intended effect here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRange(next);
  }, [pool, currentPrice, preset, fee, t0, t1]);

  const priceLower = range ? tickToPriceNum(range.lower, t0, t1) : 0;
  const priceUpper = range ? tickToPriceNum(range.upper, t0, t1) : 0;

  // Build a Position from the entered amount0 (derives amount1 for the range).
  const position = useMemo(() => {
    if (!pool || !range) return undefined;
    const a0 = parseFloat(amount0);
    if (!a0 || a0 <= 0) return undefined;
    try {
      const raw0 = BigInt(Math.floor(a0 * 10 ** t0.decimals));
      return Position.fromAmount0({
        pool,
        tickLower: Math.min(range.lower, range.upper),
        tickUpper: Math.max(range.lower, range.upper),
        amount0: raw0.toString(),
        useFullPrecision: true,
      });
    } catch {
      return undefined;
    }
  }, [pool, range, amount0, t0]);

  const amount1 = position ? Number(position.amount1.toSignificant(8)) : 0;

  // Wallet balances for the two tokens.
  const { data: balData } = useReadContracts({
    contracts: [
      { address: t0.address as `0x${string}`, abi: erc20Abi, functionName: "balanceOf", args: [address!] },
      { address: t1.address as `0x${string}`, abi: erc20Abi, functionName: "balanceOf", args: [address!] },
      { address: t0.address as `0x${string}`, abi: erc20Abi, functionName: "allowance", args: [address!, DEX.positionManager] },
      { address: t1.address as `0x${string}`, abi: erc20Abi, functionName: "allowance", args: [address!, DEX.positionManager] },
    ],
    query: { enabled: Boolean(address), refetchInterval: 12_000 },
  });
  const bal0 = balData?.[0]?.status === "success" ? Number(balData[0].result) / 10 ** t0.decimals : 0;
  const bal1 = balData?.[1]?.status === "success" ? Number(balData[1].result) / 10 ** t1.decimals : 0;

  const { approve, mint, busy } = useLiquidityActions(() => {
    toast({ title: "Liquidity added", body: `${base.symbol} / ${quote.symbol} position minted` });
    setAmount0("");
  });

  const need0 = position ? BigInt(position.mintAmounts.amount0.toString()) : 0n;
  const need1 = position ? BigInt(position.mintAmounts.amount1.toString()) : 0n;
  const allow0 = balData?.[2]?.status === "success" ? (balData[2].result as bigint) : 0n;
  const allow1 = balData?.[3]?.status === "success" ? (balData[3].result as bigint) : 0n;
  const needApprove0 = position && allow0 < need0;
  const needApprove1 = position && allow1 < need1;

  const depthBars = useDepthBars(currentPrice, priceLower, priceUpper);

  const onSubmit = () => {
    if (!wallet.connected) return wallet.open();
    if (!position) return;
    if (needApprove0) {
      approve(t0.address as `0x${string}`, need0, {
        onSuccess: () => toast({ title: "Approve submitted", body: `Authorizing ${t0.symbol}` }),
        onError: (e) => toast({ title: "Approve failed", body: e.message, kind: "error" }),
      });
    } else if (needApprove1) {
      approve(t1.address as `0x${string}`, need1, {
        onSuccess: () => toast({ title: "Approve submitted", body: `Authorizing ${t1.symbol}` }),
        onError: (e) => toast({ title: "Approve failed", body: e.message, kind: "error" }),
      });
    } else {
      mint(position, slippage, {
        onSuccess: () => toast({ title: "Mint submitted", body: "Confirm in your wallet to add liquidity" }),
        onError: (e) => toast({ title: "Mint failed", body: e.message, kind: "error" }),
      });
    }
  };

  const insufficient = (parseFloat(amount0) || 0) > bal0 || amount1 > bal1;
  const cta = !wallet.connected
    ? "Connect wallet"
    : !exists
      ? "Pool not initialized"
      : !position
        ? "Enter an amount"
        : insufficient
          ? "Insufficient balance"
          : busy
            ? "Confirming…"
            : needApprove0
              ? `Approve ${t0.symbol}`
              : needApprove1
                ? `Approve ${t1.symbol}`
                : "Add liquidity";

  return (
      <div className="add-liq-grid" style={{ display: "grid", gap: 24 }}>
        {/* Left: pair, fee, range chart */}
        <div className="col gap-16" style={{ minWidth: 0 }}>
          <div className="panel" style={{ padding: 20 }}>
            <span className="caps">Pair</span>
            <div className="row gap-8" style={{ marginTop: 12 }}>
              <TokenSelect value={base} exclude={quote} onChange={setBase} />
              <button className="btn btn-ghost btn-sm" style={{ padding: 8 }} onClick={() => { setBase(quote); setQuote(base); }}>
                <Icon.Swap size={13} />
              </button>
              <TokenSelect value={quote} exclude={base} onChange={setQuote} />
            </div>

            <span className="caps" style={{ display: "block", marginTop: 18, marginBottom: 10 }}>Fee tier</span>
            <div className="row gap-8">
              {FEE_OPTIONS.map((o) => (
                <button
                  key={o.fee}
                  onClick={() => setFee(o.fee)}
                  className="panel"
                  style={{
                    flex: 1, padding: "10px 12px", textAlign: "left", cursor: "pointer",
                    borderColor: fee === o.fee ? "var(--accent)" : "var(--line)",
                    background: fee === o.fee ? "color-mix(in oklch, var(--accent) 8%, var(--panel))" : "var(--panel)",
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{o.label}</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{o.hint}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="panel" style={{ padding: 20 }}>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
              <span className="caps">Price range</span>
              {currentPrice !== undefined && (
                <span className="mono" style={{ fontSize: 12, color: "var(--text-2)" }}>
                  1 {t0.symbol} = {fmtNum(currentPrice, 6)} {t1.symbol}
                </span>
              )}
            </div>

            <div className="row gap-8" style={{ marginBottom: 14 }}>
              {(["full", "safe", "concentrated", "custom"] as Preset[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPreset(p)}
                  className="chip"
                  style={{
                    textTransform: "capitalize",
                    color: preset === p ? "var(--accent)" : "var(--text-2)",
                    borderColor: preset === p ? "color-mix(in oklch, var(--accent) 40%, transparent)" : "var(--line)",
                  }}
                >
                  {p === "safe" ? "Safe ±10%" : p === "concentrated" ? "Conc. ±2%" : p}
                </button>
              ))}
            </div>

            {pool && currentPrice !== undefined && range ? (
              <RangeChart
                bars={depthBars}
                current={currentPrice}
                min={priceLower}
                max={priceUpper}
                symbol1={t1.symbol}
                onChange={({ min, max }) => {
                  setPreset("custom");
                  setRange((r) => {
                    if (!r) return r;
                    return {
                      lower: min !== undefined ? priceToTick(min, t0, t1, fee) : r.lower,
                      upper: max !== undefined ? priceToTick(max, t0, t1, fee) : r.upper,
                    };
                  });
                }}
              />
            ) : (
              <div className="muted" style={{ padding: "40px 0", textAlign: "center", fontSize: 13 }}>
                {exists ? "Loading pool…" : "This pool is not initialized yet."}
              </div>
            )}

            <div className="row gap-12" style={{ marginTop: 14 }}>
              <RangeField label="Min price" value={fmtNum(priceLower, 6)} symbol={t1.symbol} />
              <RangeField label="Max price" value={fmtNum(priceUpper, 6)} symbol={t1.symbol} />
            </div>
          </div>
        </div>

        {/* Right: deposit amounts + submit */}
        <div className="col gap-16" style={{ minWidth: 0, alignSelf: "start" }}>
          <div className="panel" style={{ padding: 20 }}>
            <span className="caps" style={{ display: "block", marginBottom: 12 }}>Deposit</span>
            <DepositInput symbol={t0.symbol} value={amount0} onChange={setAmount0} balance={bal0} editable />
            <div style={{ height: 10 }} />
            <DepositInput symbol={t1.symbol} value={amount1 > 0 ? fmtNum(amount1, 6) : ""} balance={bal1} />

            <div className="hairline" style={{ margin: "16px 0" }} />
            <div className="col gap-8" style={{ fontSize: 13 }}>
              <Row label="Selected range" value={`${fmtNum(priceLower, 4)} – ${fmtNum(priceUpper, 4)}`} />
              <Row label="Fee tier" value={FEE_OPTIONS.find((o) => o.fee === fee)?.label ?? "-"} />
              <Row label="Slippage" value={`${slippage}%`} />
            </div>

            <button
              className="btn btn-primary btn-lg"
              disabled={wallet.connected && (!position || insufficient || busy || !exists)}
              onClick={onSubmit}
              style={{ width: "100%", marginTop: 16, justifyContent: "center", opacity: wallet.connected && (!position || insufficient || !exists) ? 0.5 : 1 }}
            >
              {cta}
            </button>
          </div>

          <div className="row gap-8" style={{ fontSize: 12, color: "var(--text-3)" }}>
            <Icon.Shield size={12} />
            <span>Fees accrue only while the price trades inside your range.</span>
          </div>
        </div>
      </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Position detail - collect fees + remove liquidity (FE-20..22)
// ─────────────────────────────────────────────────────────────────────────────

export function PositionDetailPage({ tokenId }: { tokenId: string }) {
  const wallet = useWallet();
  const toast = useToast();
  const { positions, loading } = usePositions();
  const p = positions.find((x) => x.tokenId.toString() === tokenId);
  const [removePct, setRemovePct] = useState(100);

  const { remove, collect, busy } = useLiquidityActions(() =>
    toast({ title: "Submitted", body: "Confirm in your wallet" }),
  );

  if (!wallet.connected) {
    return (
      <Shell tokenId={tokenId}>
        <EmptyState title="Connect your wallet" body="Connect to manage this position." cta={<button className="btn btn-primary" onClick={wallet.open}>Connect wallet</button>} />
      </Shell>
    );
  }
  if (loading) return <Shell tokenId={tokenId}><SkeletonCard /></Shell>;
  if (!p) return <Shell tokenId={tokenId}><EmptyState title="Position not found" body={`No position #${tokenId} in this wallet.`} /></Shell>;

  const hasFees = p.fees0 + p.fees1 > 0;

  const onCollect = () =>
    collect(
      { tokenId: p.tokenId, pool: p.sdk.position.pool, owed0: p.sdk.owed0, owed1: p.sdk.owed1 },
      {
        onSuccess: () => toast({ title: "Collect submitted", body: "Confirm in your wallet" }),
        onError: (e) => toast({ title: "Collect failed", body: e.message, kind: "error" }),
      },
    );

  const onRemove = () =>
    remove(p.sdk.position, p.tokenId, removePct / 100, 0.5, {
      onSuccess: () => toast({ title: "Remove submitted", body: `Removing ${removePct}% of liquidity` }),
      onError: (e) => toast({ title: "Remove failed", body: e.message, kind: "error" }),
    });

  return (
    <Shell tokenId={tokenId} pair={`${p.symbol0} / ${p.symbol1}`}>
      <div className="add-liq-grid" style={{ display: "grid", gap: 24 }}>
        <div className="col gap-16" style={{ minWidth: 0 }}>
          <PositionCard p={p} />
          <div className="panel" style={{ padding: 20 }}>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
              <span className="caps">Unclaimed fees</span>
              <button className="btn btn-primary btn-sm" disabled={!hasFees || busy} onClick={onCollect} style={{ opacity: !hasFees || busy ? 0.5 : 1 }}>
                <Icon.Gift size={13} /> Collect
              </button>
            </div>
            <div className="col gap-8" style={{ fontSize: 13 }}>
              <Row label={p.symbol0} value={fmtNum(p.fees0, 6)} />
              <Row label={p.symbol1} value={fmtNum(p.fees1, 6)} />
            </div>
          </div>
        </div>

        <div className="col gap-16" style={{ minWidth: 0, alignSelf: "start" }}>
          {!p.closed && <IncreasePanel p={p} />}
          <div className="panel" style={{ padding: 20 }}>
            <span className="caps" style={{ display: "block", marginBottom: 14 }}>Remove liquidity</span>
            <div className="num" style={{ fontSize: 34, fontWeight: 600, color: "var(--accent)" }}>{removePct}%</div>
            <input
              type="range"
              min={1}
              max={100}
              value={removePct}
              onChange={(e) => setRemovePct(Number(e.target.value))}
              style={{ width: "100%", margin: "14px 0", accentColor: "var(--accent)" }}
            />
            <div className="row gap-8" style={{ marginBottom: 16 }}>
              {[25, 50, 75, 100].map((v) => (
                <button key={v} className="chip" onClick={() => setRemovePct(v)} style={{ flex: 1, color: removePct === v ? "var(--accent)" : "var(--text-2)" }}>
                  {v}%
                </button>
              ))}
            </div>
            <button className="btn btn-primary btn-lg" disabled={busy || p.closed} onClick={onRemove} style={{ width: "100%", justifyContent: "center", opacity: busy || p.closed ? 0.5 : 1 }}>
              {p.closed ? "Position closed" : busy ? "Confirming…" : removePct === 100 ? "Remove all & burn" : `Remove ${removePct}%`}
            </button>
          </div>
        </div>
      </div>
    </Shell>
  );
}

// Add to an existing position, reusing the position's pool + tick range. Mirrors
// the deposit side of AddLiquidityPage but bound to a single live position.
function IncreasePanel({ p }: { p: PositionInfo }) {
  const wallet = useWallet();
  const toast = useToast();
  const { address } = useAccount();
  const [amount0, setAmount0] = useState("");

  const pool = p.sdk.position.pool;
  const t0 = pool.token0;
  const t1 = pool.token1;

  const position = useMemo(() => {
    const a0 = parseFloat(amount0);
    if (!a0 || a0 <= 0) return undefined;
    try {
      const raw0 = BigInt(Math.floor(a0 * 10 ** t0.decimals));
      return Position.fromAmount0({
        pool,
        tickLower: p.tickLower,
        tickUpper: p.tickUpper,
        amount0: raw0.toString(),
        useFullPrecision: true,
      });
    } catch {
      return undefined;
    }
  }, [amount0, pool, p.tickLower, p.tickUpper, t0]);

  const amount1 = position ? Number(position.amount1.toSignificant(8)) : 0;

  const { data: balData } = useReadContracts({
    contracts: [
      { address: t0.address as `0x${string}`, abi: erc20Abi, functionName: "balanceOf", args: [address!] },
      { address: t1.address as `0x${string}`, abi: erc20Abi, functionName: "balanceOf", args: [address!] },
      { address: t0.address as `0x${string}`, abi: erc20Abi, functionName: "allowance", args: [address!, DEX.positionManager] },
      { address: t1.address as `0x${string}`, abi: erc20Abi, functionName: "allowance", args: [address!, DEX.positionManager] },
    ],
    query: { enabled: Boolean(address), refetchInterval: 12_000 },
  });
  const bal0 = balData?.[0]?.status === "success" ? Number(balData[0].result) / 10 ** t0.decimals : 0;
  const bal1 = balData?.[1]?.status === "success" ? Number(balData[1].result) / 10 ** t1.decimals : 0;

  const { approve, increase, busy } = useLiquidityActions(() => {
    toast({ title: "Liquidity added", body: `Increased ${p.symbol0} / ${p.symbol1} position` });
    setAmount0("");
  });

  const need0 = position ? BigInt(position.mintAmounts.amount0.toString()) : 0n;
  const need1 = position ? BigInt(position.mintAmounts.amount1.toString()) : 0n;
  const allow0 = balData?.[2]?.status === "success" ? (balData[2].result as bigint) : 0n;
  const allow1 = balData?.[3]?.status === "success" ? (balData[3].result as bigint) : 0n;
  const needApprove0 = position && allow0 < need0;
  const needApprove1 = position && allow1 < need1;

  const insufficient = (parseFloat(amount0) || 0) > bal0 || amount1 > bal1;

  const onSubmit = () => {
    if (!wallet.connected) return wallet.open();
    if (!position) return;
    if (needApprove0) {
      approve(t0.address as `0x${string}`, need0, {
        onSuccess: () => toast({ title: "Approve submitted", body: `Authorizing ${t0.symbol}` }),
        onError: (e) => toast({ title: "Approve failed", body: e.message, kind: "error" }),
      });
    } else if (needApprove1) {
      approve(t1.address as `0x${string}`, need1, {
        onSuccess: () => toast({ title: "Approve submitted", body: `Authorizing ${t1.symbol}` }),
        onError: (e) => toast({ title: "Approve failed", body: e.message, kind: "error" }),
      });
    } else {
      increase(position, p.tokenId, 0.5, {
        onSuccess: () => toast({ title: "Increase submitted", body: "Confirm in your wallet to add liquidity" }),
        onError: (e) => toast({ title: "Increase failed", body: e.message, kind: "error" }),
      });
    }
  };

  const cta = !wallet.connected
    ? "Connect wallet"
    : !position
      ? "Enter an amount"
      : insufficient
        ? "Insufficient balance"
        : busy
          ? "Confirming…"
          : needApprove0
            ? `Approve ${t0.symbol}`
            : needApprove1
              ? `Approve ${t1.symbol}`
              : "Increase liquidity";

  return (
    <div className="panel" style={{ padding: 20 }}>
      <span className="caps" style={{ display: "block", marginBottom: 12 }}>Increase liquidity</span>
      <DepositInput symbol={p.symbol0} value={amount0} onChange={setAmount0} balance={bal0} editable />
      <div style={{ height: 10 }} />
      <DepositInput symbol={p.symbol1} value={amount1 > 0 ? fmtNum(amount1, 6) : ""} balance={bal1} />
      <button
        className="btn btn-primary btn-lg"
        disabled={wallet.connected && (!position || insufficient || busy)}
        onClick={onSubmit}
        style={{ width: "100%", marginTop: 14, justifyContent: "center", opacity: wallet.connected && (!position || insufficient) ? 0.5 : 1 }}
      >
        {cta}
      </button>
    </div>
  );
}

const Shell = ({ tokenId, pair, children }: { tokenId: string; pair?: string; children: React.ReactNode }) => (
  <main className="container-app" style={{ paddingTop: 40, paddingBottom: 80, paddingLeft: 32, paddingRight: 32 }}>
    <div className="row gap-12" style={{ marginBottom: 24, alignItems: "center" }}>
      <Link href="/pool" className="btn btn-ghost btn-sm" style={{ padding: 8 }}><Icon.Arrow dir="left" size={14} /></Link>
      <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>{pair ?? "Position"} <span className="mono" style={{ fontSize: 14, color: "var(--text-3)" }}>#{tokenId}</span></h1>
    </div>
    {children}
  </main>
);

// ── Small building blocks ────────────────────────────────────────────────────

function useDepthBars(current?: number, lower?: number, upper?: number): DepthBar[] {
  // Representative liquidity profile centred on the current price. Real on-chain
  // tick liquidity (via TickLens) can replace this; the shape is illustrative.
  return useMemo(() => {
    if (!current) return [];
    const span = Math.max(upper ?? current * 1.5, current * 1.5) - Math.min(lower ?? current * 0.5, current * 0.5);
    const center = current;
    const sigma = span / 5 || current * 0.3;
    const n = 48;
    const from = Math.max(center - span, center * 0.3);
    const to = center + span;
    return Array.from({ length: n }, (_, i) => {
      const price = from + ((to - from) * i) / (n - 1);
      const liquidity = Math.exp(-((price - center) ** 2) / (2 * sigma * sigma));
      return { price, liquidity };
    });
  }, [current, lower, upper]);
}

const TokenSelect = ({ value, exclude, onChange }: { value: Token; exclude: Token; onChange: (t: Token) => void }) => (
  <select
    value={value.address}
    onChange={(e) => {
      const t = DEX_TOKENS.find((x) => x.address === e.target.value);
      if (t) onChange(t);
    }}
    className="input"
    style={{ flex: 1, cursor: "pointer" }}
  >
    {DEX_TOKENS.map((t) => (
      <option key={t.address} value={t.address} disabled={t.address === exclude.address}>
        {t.symbol}
      </option>
    ))}
  </select>
);

const DepositInput = ({ symbol, value, onChange, balance, editable }: { symbol?: string; value: string; onChange?: (v: string) => void; balance: number; editable?: boolean }) => (
  <div style={{ background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 10, padding: 14 }}>
    <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
      <span style={{ fontSize: 12, color: "var(--text-3)" }}>{symbol}</span>
      <span style={{ fontSize: 12, color: "var(--text-3)" }}>
        Balance: <span className="mono">{fmtNum(balance)}</span>
        {editable && balance > 0 && (
          <button className="chip" style={{ marginLeft: 8, fontSize: 10, padding: "1px 7px", color: "var(--accent)" }} onClick={() => onChange?.(balance.toString())}>MAX</button>
        )}
      </span>
    </div>
    {editable ? (
      <input
        className="num"
        value={value}
        onChange={(e) => onChange?.(e.target.value.replace(/[^0-9.]/g, ""))}
        placeholder="0"
        style={{ width: "100%", background: "transparent", border: "none", outline: "none", fontSize: 26, fontWeight: 500, color: "var(--text)", padding: 0 }}
      />
    ) : (
      <div className="num" style={{ fontSize: 26, fontWeight: 500, color: value ? "var(--text)" : "var(--text-3)" }}>{value || "0"}</div>
    )}
  </div>
);

const RangeField = ({ label, value, symbol }: { label: string; value: string; symbol?: string }) => (
  <div className="panel" style={{ flex: 1, padding: 12 }}>
    <div className="caps">{label}</div>
    <div className="mono" style={{ fontSize: 15, marginTop: 4 }}>{value}</div>
    <div style={{ fontSize: 11, color: "var(--text-3)" }}>{symbol} per token</div>
  </div>
);

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="row" style={{ justifyContent: "space-between" }}>
    <span className="muted">{label}</span>
    <span className="mono">{value}</span>
  </div>
);

const EmptyState = ({ title, body, cta }: { title: string; body: string; cta?: React.ReactNode }) => (
  <div className="panel" style={{ padding: 56, textAlign: "center" }}>
    <div style={{ fontSize: 16, fontWeight: 600 }}>{title}</div>
    <div className="muted" style={{ fontSize: 13, marginTop: 8, maxWidth: 420, marginInline: "auto" }}>{body}</div>
    {cta && <div style={{ marginTop: 20 }}>{cta}</div>}
  </div>
);

const SkeletonCard = () => (
  <div className="panel skeleton" style={{ padding: 18, height: 150 }} />
);

function nearestFullTick(fee: FeeAmount, lower: boolean): number {
  const max = TickMath.MAX_TICK - (TickMath.MAX_TICK % spacingFor(fee));
  return lower ? -max : max;
}

function spacingFor(fee: FeeAmount): number {
  // TICK_SPACINGS values: 0.05%→10, 0.30%→60, 1.00%→200.
  return fee === FeeAmount.LOW ? 10 : fee === FeeAmount.HIGH ? 200 : 60;
}
