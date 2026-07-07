"use client";

// V2 (classic constant-product) liquidity UI. Rendered alongside the V3 flow:
//   <AddLiquidityV2>  - the deposit form (pair, paired amounts, approve + add).
//   <V2Positions>     - the wallet's V2 LP positions with an inline remove control.
// All math + chain access is behind lib/liquidity-v2.ts; this file is presentation.

import React, { useState } from "react";
import { useAccount, useReadContracts } from "wagmi";
import { Token } from "@uniswap/sdk-core";
import { Icon } from "../icons";
import { useWallet } from "../wallet";
import { useToast } from "../toast";
import { fmtNum } from "@/lib/format";
import { erc20Abi } from "@/lib/contracts";
import { DEX } from "@/lib/dex";
import { useTxQueue } from "@/lib/txqueue";
import { DEX_TOKENS } from "@/lib/liquidity";
import {
  useV2Pair,
  useV2Positions,
  useV2Actions,
  parseAmount,
  withSlippage,
  type V2PositionInfo,
} from "@/lib/liquidity-v2";

const SLIPPAGE = 0.5;

// ── Add liquidity (V2) ───────────────────────────────────────────────────────

export function AddLiquidityV2() {
  const wallet = useWallet();
  const toast = useToast();
  const { address } = useAccount();

  const [base, setBase] = useState<Token>(DEX_TOKENS[0]);
  const [quote, setQuote] = useState<Token>(DEX_TOKENS[1]);
  const pair = useV2Pair(base, quote);

  const [amountA, setAmountA] = useState("");
  const [amountBManual, setAmountBManual] = useState("");

  const hasReserves = pair.exists && pair.reserveARaw > 0n && pair.reserveBRaw > 0n;
  const amtA = parseFloat(amountA) || 0;

  const aDesired = parseAmount(amountA, base.decimals);
  const bDesired =
    hasReserves && aDesired > 0n
      ? (aDesired * pair.reserveBRaw) / pair.reserveARaw
      : parseAmount(amountBManual, quote.decimals);
  const amountBHuman = hasReserves
    ? amtA > 0
      ? amtA * (pair.reserveB / pair.reserveA)
      : 0
    : parseFloat(amountBManual) || 0;

  const { data: balData } = useReadContracts({
    contracts: [
      { address: base.address as `0x${string}`, abi: erc20Abi, functionName: "balanceOf", args: [address!] },
      { address: quote.address as `0x${string}`, abi: erc20Abi, functionName: "balanceOf", args: [address!] },
      { address: base.address as `0x${string}`, abi: erc20Abi, functionName: "allowance", args: [address!, DEX.v2Router] },
      { address: quote.address as `0x${string}`, abi: erc20Abi, functionName: "allowance", args: [address!, DEX.v2Router] },
    ],
    query: { enabled: Boolean(address), refetchInterval: 12_000 },
  });
  const balA = balData?.[0]?.status === "success" ? Number(balData[0].result) / 10 ** base.decimals : 0;
  const balB = balData?.[1]?.status === "success" ? Number(balData[1].result) / 10 ** quote.decimals : 0;
  const allowA = balData?.[2]?.status === "success" ? (balData[2].result as bigint) : 0n;
  const allowB = balData?.[3]?.status === "success" ? (balData[3].result as bigint) : 0n;

  const queue = useTxQueue();
  const { approve, addLiquidity, busy } = useV2Actions(() => {
    // An approval mined → the next queued step fires and re-prompts the wallet.
    if (queue.advance()) return;
    toast({ title: "Liquidity added", body: `${base.symbol} / ${quote.symbol} V2 position` });
    setAmountA("");
    setAmountBManual("");
    pair.refetch();
  });

  const valid = aDesired > 0n && bDesired > 0n;
  const needApproveA = valid && allowA < aDesired;
  const needApproveB = valid && allowB < bDesired;
  const insufficient = amtA > balA || amountBHuman > balB;

  const onSubmit = () => {
    if (!wallet.connected) return wallet.open();
    if (!valid) return;
    const approveErr = (e: Error) => { queue.clear(); toast({ title: "Approve failed", body: e.message, kind: "error" }); };
    const steps: (() => void)[] = [];
    if (needApproveA)
      steps.push(() =>
        approve(base.address as `0x${string}`, DEX.v2Router, aDesired, {
          onSuccess: () => toast({ title: "Approve submitted", body: `Authorizing ${base.symbol}` }),
          onError: approveErr,
        }),
      );
    if (needApproveB)
      steps.push(() =>
        approve(quote.address as `0x${string}`, DEX.v2Router, bDesired, {
          onSuccess: () => toast({ title: "Approve submitted", body: `Authorizing ${quote.symbol}` }),
          onError: approveErr,
        }),
      );
    steps.push(() =>
      addLiquidity(
        base.address as `0x${string}`,
        quote.address as `0x${string}`,
        aDesired,
        bDesired,
        withSlippage(aDesired, SLIPPAGE),
        withSlippage(bDesired, SLIPPAGE),
        {
          onSuccess: () => toast({ title: "Add submitted", body: "Confirm in your wallet to add liquidity" }),
          onError: (e) => { queue.clear(); toast({ title: "Add failed", body: e.message, kind: "error" }); },
        },
      ),
    );
    queue.start(steps);
  };

  const cta = !wallet.connected
    ? "Connect wallet"
    : !valid
      ? hasReserves || pair.exists
        ? "Enter an amount"
        : "Set the initial amounts"
      : insufficient
        ? "Insufficient balance"
        : busy
          ? "Confirming…"
          : needApproveA || needApproveB
            ? "Approve & add liquidity"
            : "Add liquidity";

  return (
    <div className="add-liq-grid" style={{ display: "grid", gap: 24 }}>
      {/* Left: pair + pool state */}
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

          <div className="hairline" style={{ margin: "18px 0" }} />
          <span className="caps">Pool</span>
          {pair.exists ? (
            <div className="col gap-8" style={{ marginTop: 12, fontSize: 13 }}>
              <Row label={`${base.symbol} reserve`} value={fmtNum(pair.reserveA)} />
              <Row label={`${quote.symbol} reserve`} value={fmtNum(pair.reserveB)} />
              <Row
                label="Price"
                value={hasReserves ? `1 ${base.symbol} = ${fmtNum(pair.reserveB / pair.reserveA, 6)} ${quote.symbol}` : "-"}
              />
              {pair.lpBalanceNum > 0 && (
                <Row label="Your pool share" value={`${pair.sharePct.toFixed(4)}%`} accent />
              )}
            </div>
          ) : (
            <div className="muted" style={{ marginTop: 12, fontSize: 13 }}>
              No V2 pool yet for this pair. Your deposit creates it and sets the starting price.
            </div>
          )}
        </div>

        <div className="row gap-8" style={{ fontSize: 12, color: "var(--text-3)" }}>
          <Icon.Shield size={12} />
          <span>Classic pools earn a fee on every swap, spread evenly across the full price curve.</span>
        </div>
      </div>

      {/* Right: deposit + submit */}
      <div className="col gap-16" style={{ minWidth: 0, alignSelf: "start" }}>
        <div className="panel" style={{ padding: 20 }}>
          <span className="caps" style={{ display: "block", marginBottom: 12 }}>Deposit</span>
          <AmountInput symbol={base.symbol} value={amountA} onChange={setAmountA} balance={balA} editable />
          <div style={{ height: 10 }} />
          {hasReserves ? (
            <AmountInput symbol={quote.symbol} value={amountBHuman > 0 ? fmtNum(amountBHuman, 6) : ""} balance={balB} />
          ) : (
            <AmountInput symbol={quote.symbol} value={amountBManual} onChange={setAmountBManual} balance={balB} editable />
          )}

          <div className="hairline" style={{ margin: "16px 0" }} />
          <div className="col gap-8" style={{ fontSize: 13 }}>
            <Row label="Pool" value={pair.exists ? "Existing" : "New"} />
            <Row label="Slippage" value={`${SLIPPAGE}%`} />
          </div>

          <button
            className="btn btn-primary btn-lg"
            disabled={wallet.connected && (!valid || insufficient || busy)}
            onClick={onSubmit}
            style={{ width: "100%", marginTop: 16, justifyContent: "center", opacity: wallet.connected && (!valid || insufficient) ? 0.5 : 1 }}
          >
            {cta}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Positions list + remove (V2) ─────────────────────────────────────────────

export function V2Positions() {
  const wallet = useWallet();
  const { positions, loading, refetch } = useV2Positions();

  if (!wallet.connected || (!loading && positions.length === 0)) return null;

  return (
    <section style={{ marginTop: 32 }}>
      <div className="row gap-8" style={{ alignItems: "center", marginBottom: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Classic (V2) positions</h2>
        <span className="chip" style={{ fontSize: 10, padding: "1px 8px" }}>Constant product</span>
      </div>
      {loading ? (
        <div className="pool-grid" style={{ display: "grid", gap: 16 }}>
          <div className="panel skeleton" style={{ padding: 18, height: 150 }} />
        </div>
      ) : (
        <div className="pool-grid" style={{ display: "grid", gap: 16 }}>
          {positions.map((p) => (
            <V2PositionCard key={p.pairAddress} p={p} onChanged={refetch} />
          ))}
        </div>
      )}
    </section>
  );
}

function V2PositionCard({ p, onChanged }: { p: V2PositionInfo; onChanged: () => void }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [pct, setPct] = useState(100);

  const queue = useTxQueue();
  const { approve, removeLiquidity, busy } = useV2Actions(() => {
    if (queue.advance()) return;
    toast({ title: "Liquidity removed", body: `${p.tokenA.symbol} / ${p.tokenB.symbol}` });
    onChanged();
    setOpen(false);
  });

  const liquidity = (p.lpBalance * BigInt(pct)) / 100n;
  const supply = p.totalSupply > 0n ? p.totalSupply : 1n;
  const aMin = withSlippage((p.reserveARaw * liquidity) / supply, SLIPPAGE);
  const bMin = withSlippage((p.reserveBRaw * liquidity) / supply, SLIPPAGE);
  const needApproveLp = p.lpAllowance < liquidity;

  const onRemove = () => {
    if (liquidity <= 0n) return;
    const steps: (() => void)[] = [];
    if (needApproveLp)
      steps.push(() =>
        approve(p.pairAddress!, DEX.v2Router, liquidity, {
          onSuccess: () => toast({ title: "Approve submitted", body: "Authorizing LP token - removal follows automatically" }),
          onError: (e) => { queue.clear(); toast({ title: "Approve failed", body: e.message, kind: "error" }); },
        }),
      );
    steps.push(() =>
      removeLiquidity(
        p.tokenA.address as `0x${string}`,
        p.tokenB.address as `0x${string}`,
        liquidity,
        aMin,
        bMin,
        {
          onSuccess: () => toast({ title: "Remove submitted", body: `Removing ${pct}% of liquidity` }),
          onError: (e) => { queue.clear(); toast({ title: "Remove failed", body: e.message, kind: "error" }); },
        },
      ),
    );
    queue.start(steps);
  };

  return (
    <div className="panel" style={{ padding: 18, display: "grid", gap: 14 }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div className="row gap-8" style={{ alignItems: "center" }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{p.tokenA.symbol} / {p.tokenB.symbol}</span>
          <span className="chip" style={{ fontSize: 10, padding: "1px 7px" }}>V2</span>
        </div>
        <div className="col gap-4" style={{ alignItems: "flex-end" }}>
          <span className="caps">Pool share</span>
          <span className="mono" style={{ fontSize: 12.5, color: "var(--accent)" }}>{p.sharePct.toFixed(4)}%</span>
        </div>
      </div>

      <div className="row" style={{ justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <Metric label="Pooled" value={`${fmtNum(p.amountA)} ${p.tokenA.symbol} · ${fmtNum(p.amountB)} ${p.tokenB.symbol}`} />
        <Metric label="LP tokens" value={fmtNum(p.lpBalanceNum, 6)} />
      </div>

      {!open ? (
        <button className="btn btn-ghost btn-sm" onClick={() => setOpen(true)} style={{ justifyContent: "center" }}>
          Manage
        </button>
      ) : (
        <div style={{ background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 10, padding: 14 }}>
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
            <span className="caps">Remove</span>
            <span className="num" style={{ fontSize: 18, fontWeight: 600, color: "var(--accent)" }}>{pct}%</span>
          </div>
          <input
            type="range"
            min={1}
            max={100}
            value={pct}
            onChange={(e) => setPct(Number(e.target.value))}
            style={{ width: "100%", margin: "6px 0 12px", accentColor: "var(--accent)" }}
          />
          <div className="row gap-6" style={{ marginBottom: 12 }}>
            {[25, 50, 75, 100].map((v) => (
              <button key={v} className="chip" onClick={() => setPct(v)} style={{ flex: 1, color: pct === v ? "var(--accent)" : "var(--text-2)" }}>
                {v}%
              </button>
            ))}
          </div>
          <div className="row gap-8">
            <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)} style={{ flex: 1, justifyContent: "center" }}>
              Cancel
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={onRemove}
              disabled={busy}
              style={{ flex: 1, justifyContent: "center", opacity: busy ? 0.5 : 1 }}
            >
              {busy ? "Confirming…" : needApproveLp ? `Approve & remove ${pct}%` : `Remove ${pct}%`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Small local primitives ───────────────────────────────────────────────────

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

const AmountInput = ({ symbol, value, onChange, balance, editable }: { symbol?: string; value: string; onChange?: (v: string) => void; balance: number; editable?: boolean }) => (
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

const Row = ({ label, value, accent }: { label: string; value: string; accent?: boolean }) => (
  <div className="row" style={{ justifyContent: "space-between" }}>
    <span className="muted">{label}</span>
    <span className="mono" style={{ color: accent ? "var(--accent)" : undefined }}>{value}</span>
  </div>
);

const Metric = ({ label, value, accent }: { label: string; value: string; accent?: boolean }) => (
  <div className="col gap-4" style={{ minWidth: 0 }}>
    <span className="caps">{label}</span>
    <span className="mono" style={{ fontSize: 12.5, color: accent ? "var(--accent)" : "var(--text)" }}>{value}</span>
  </div>
);
