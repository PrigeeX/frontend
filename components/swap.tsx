"use client";

import React, { useMemo, useState } from "react";
import { Icon, TokenIcon } from "./icons";
import { useWallet } from "./wallet";
import { useToast } from "./toast";
import { TOKENS, tokenBySymbol, type TokenSymbol } from "@/lib/tokens";
import { fmtNum } from "@/lib/format";

// Mock balances for demo (swap is not wired to a live DEX; PGX balance is fetched on the stake page).
const MOCK_BALANCES: Record<TokenSymbol, number> = {
  PGX: 0,
  ETH: 2.4138,
  USDC: 4820.11,
  USDT: 0,
  WBTC: 0.0345,
  DAI: 0,
  ARB: 0,
  OP: 0,
};

const TokenInput = ({
  label,
  symbol,
  amount,
  onAmount,
  balance,
  onPickToken,
  onMax,
  onHalf,
  readOnly,
  isInput,
}: {
  label: string;
  symbol: TokenSymbol;
  amount: string;
  onAmount?: (v: string) => void;
  balance: number;
  onPickToken: () => void;
  onMax?: () => void;
  onHalf?: () => void;
  readOnly?: boolean;
  isInput?: boolean;
}) => {
  const tok = tokenBySymbol(symbol);
  const usd = (parseFloat(amount) || 0) * tok.price;
  return (
    <div style={{ background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 10, padding: 16 }}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: "var(--text-3)" }}>{label}</span>
        <div className="row gap-8" style={{ fontSize: 12, color: "var(--text-3)" }}>
          <span>Balance: <span className="mono">{fmtNum(balance)}</span></span>
          {isInput && balance > 0 && (
            <>
              <button onClick={onHalf} className="chip" style={{ padding: "1px 8px", fontSize: 10, color: "var(--accent)", borderColor: "color-mix(in oklch, var(--accent) 30%, transparent)" }}>50%</button>
              <button onClick={onMax} className="chip" style={{ padding: "1px 8px", fontSize: 10, color: "var(--accent)", borderColor: "color-mix(in oklch, var(--accent) 30%, transparent)" }}>MAX</button>
            </>
          )}
        </div>
      </div>
      <div className="row gap-12">
        {readOnly ? (
          <div className="num" style={{ fontSize: 28, fontWeight: 500, flex: 1, color: amount ? "var(--text)" : "var(--text-3)" }}>
            {amount || "0"}
          </div>
        ) : (
          <input
            className="num"
            value={amount}
            onChange={(e) => onAmount?.(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="0"
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              fontSize: 28, fontWeight: 500, color: "var(--text)",
              padding: 0, minWidth: 0,
            }}
          />
        )}
        <button
          onClick={onPickToken}
          className="row gap-8"
          style={{
            background: "var(--panel)", border: "1px solid var(--line)",
            padding: "6px 10px 6px 6px", borderRadius: 999,
            transition: "background .12s",
          }}
        >
          <TokenIcon symbol={symbol} size="sm" />
          <span style={{ fontSize: 14, fontWeight: 600 }}>{symbol}</span>
          <Icon.Arrow dir="down" size={12} />
        </button>
      </div>
      <div className="row" style={{ justifyContent: "space-between", marginTop: 8, fontSize: 12, color: "var(--text-3)" }}>
        <span className="mono">≈ ${fmtNum(usd, 2)}</span>
        <span>{tok.name}</span>
      </div>
    </div>
  );
};

const TokenPicker = ({
  exclude,
  onPick,
  close,
  balances,
}: {
  exclude: TokenSymbol;
  onPick: (s: TokenSymbol) => void;
  close: () => void;
  balances: Record<TokenSymbol, number>;
}) => {
  const [q, setQ] = useState("");
  const filtered = TOKENS.filter(
    (t) =>
      t.symbol !== exclude &&
      (t.symbol.toLowerCase().includes(q.toLowerCase()) || t.name.toLowerCase().includes(q.toLowerCase()))
  );
  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div
          className="row"
          style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)", justifyContent: "space-between" }}
        >
          <div style={{ fontSize: 15, fontWeight: 600 }}>Select a token</div>
          <button onClick={close} style={{ color: "var(--text-2)" }}>
            <Icon.Close />
          </button>
        </div>
        <div style={{ padding: "12px 16px" }}>
          <input
            autoFocus
            className="input"
            placeholder="Search name or symbol"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div style={{ maxHeight: 360, overflowY: "auto", padding: "4px 8px 12px" }}>
          {filtered.map((t) => {
            const bal = balances[t.balanceKey] ?? 0;
            return (
              <button
                key={t.symbol}
                onClick={() => onPick(t.symbol)}
                className="row gap-12"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, textAlign: "left", background: "transparent" }}
              >
                <TokenIcon symbol={t.symbol} />
                <div className="col gap-4" style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{t.symbol}</div>
                  <div style={{ fontSize: 12, color: "var(--text-3)" }}>{t.name}</div>
                </div>
                <div className="col gap-4" style={{ alignItems: "flex-end" }}>
                  <span className="num" style={{ fontSize: 14 }}>{fmtNum(bal)}</span>
                  <span className="num" style={{ fontSize: 11, color: "var(--text-3)" }}>
                    ${fmtNum(bal * t.price, 2)}
                  </span>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="muted" style={{ padding: 40, textAlign: "center", fontSize: 13 }}>
              No tokens match &quot;{q}&quot;
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const RouteNode = ({ symbol, label, right }: { symbol: TokenSymbol; label: string; right?: boolean }) => (
  <div className="col gap-6" style={{ alignItems: right ? "flex-end" : "flex-start", minWidth: 60 }}>
    <TokenIcon symbol={symbol} />
    <span className="mono" style={{ fontSize: 10, color: "var(--text-3)" }}>{label}</span>
  </div>
);

const RouteArrow = ({ label }: { label: string }) => (
  <div className="col gap-4" style={{ alignItems: "center", flex: 1, minWidth: 0 }}>
    <div style={{ width: "100%", height: 1, background: "var(--line-2)", position: "relative" }}>
      <div
        style={{
          position: "absolute",
          right: -1,
          top: -3,
          width: 7,
          height: 7,
          borderRight: "1px solid var(--line-2)",
          borderBottom: "1px solid var(--line-2)",
          transform: "rotate(-45deg)",
        }}
      />
    </div>
    <span className="mono" style={{ fontSize: 10, color: "var(--text-3)" }}>{label}</span>
  </div>
);

const Route = ({ from, to, amount }: { from: TokenSymbol; to: TokenSymbol; amount: number }) => {
  const hasIntermediary = from !== "PGX" && to !== "PGX";
  const hop = hasIntermediary ? ("PGX" as const) : null;
  return (
    <div
      className="row"
      style={{
        justifyContent: "space-between",
        gap: 12,
        padding: "14px 12px",
        background: "var(--bg-2)",
        borderRadius: 8,
        border: "1px solid var(--line)",
      }}
    >
      <RouteNode symbol={from} label={fmtNum(amount) + " " + from} />
      <RouteArrow label="Pool 0.30%" />
      {hop && (
        <>
          <RouteNode symbol={hop} label="Routing" />
          <RouteArrow label="Pool 0.30%" />
        </>
      )}
      <RouteNode symbol={to} label={to} right />
    </div>
  );
};

const RecentSwaps = () => {
  const rows = [
    { from: "ETH", to: "PGX", amt: "0.5", out: "4,091.40", time: "12s", addr: "0x3f2a…88c1" },
    { from: "USDC", to: "PGX", amt: "250", out: "592.84", time: "48s", addr: "0xa901…ef32" },
    { from: "PGX", to: "ETH", amt: "12,000", out: "1.466", time: "1m", addr: "0x7c4d…0019" },
    { from: "WBTC", to: "USDC", amt: "0.01", out: "684.15", time: "2m", addr: "0x11b6…7742" },
    { from: "PGX", to: "USDC", amt: "5,000", out: "2,103.20", time: "3m", addr: "0xe220…aa81" },
  ] as const;
  return (
    <div>
      {rows.map((r, i) => (
        <div
          key={i}
          className="row"
          style={{
            padding: "12px 20px",
            fontSize: 13,
            borderBottom: i < rows.length - 1 ? "1px solid var(--line)" : "none",
            gap: 12,
          }}
        >
          <div className="row gap-8">
            <TokenIcon symbol={r.from} size="sm" />
            <Icon.Arrow size={11} dir="right" />
            <TokenIcon symbol={r.to} size="sm" />
          </div>
          <div className="col gap-4" style={{ flex: 1 }}>
            <span className="mono" style={{ fontSize: 12 }}>
              {r.amt} {r.from} → {r.out} {r.to}
            </span>
            <span className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>{r.addr}</span>
          </div>
          <span className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>{r.time} ago</span>
        </div>
      ))}
    </div>
  );
};

const TxModal = ({
  from,
  to,
  fromAmt,
  toAmt,
  step,
  onClose,
}: {
  from: TokenSymbol;
  to: TokenSymbol;
  fromAmt: number;
  toAmt: number;
  step: "approve" | "confirm" | "pending" | "success";
  onClose: () => void;
}) => {
  const steps = [
    { id: "approve", label: "Approve token" },
    { id: "confirm", label: "Confirm in wallet" },
    { id: "pending", label: "Waiting for block" },
    { id: "success", label: "Settled" },
  ] as const;
  const curIdx = steps.findIndex((s) => s.id === step);
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--line)" }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>
            {step === "success" ? "Swap settled" : "Signing swap"}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 4 }}>
            {fmtNum(fromAmt)} {from} → {fmtNum(toAmt)} {to}
          </div>
        </div>
        <div style={{ padding: 24 }}>
          <div className="col gap-12">
            {steps.map((s, i) => {
              const done = i < curIdx || step === "success";
              const active = i === curIdx && step !== "success";
              const upcoming = i > curIdx && step !== "success";
              return (
                <div key={s.id} className="row gap-12" style={{ opacity: upcoming ? 0.4 : 1 }}>
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      border: `1.5px solid ${done ? "var(--accent)" : active ? "var(--accent)" : "var(--line)"}`,
                      background: done ? "var(--accent)" : "transparent",
                      color: "var(--accent-ink)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      position: "relative",
                    }}
                  >
                    {done ? (
                      <Icon.Check size={12} />
                    ) : active ? (
                      <span
                        style={{
                          position: "absolute",
                          inset: -3,
                          borderRadius: "50%",
                          border: "1.5px solid var(--accent)",
                          borderTopColor: "transparent",
                          animation: "spin 0.9s linear infinite",
                        }}
                      />
                    ) : null}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: active ? 500 : 400 }}>{s.label}</span>
                </div>
              );
            })}
          </div>
          {step === "success" && (
            <div
              className="col gap-8"
              style={{ marginTop: 20, padding: 14, background: "var(--bg-2)", borderRadius: 8, border: "1px solid var(--line)" }}
            >
              <div className="row" style={{ justifyContent: "space-between", fontSize: 12 }}>
                <span className="muted">Tx hash</span>
                <span className="mono">0x8f2a…c4f1</span>
              </div>
              <div className="row" style={{ justifyContent: "space-between", fontSize: 12 }}>
                <span className="muted">Block</span>
                <span className="mono">22,418,091</span>
              </div>
              <div className="row" style={{ justifyContent: "space-between", fontSize: 12 }}>
                <span className="muted">Gas used</span>
                <span className="mono">142,508 · $1.67</span>
              </div>
            </div>
          )}
        </div>
        <div
          className="row gap-8"
          style={{ padding: 16, borderTop: "1px solid var(--line)", justifyContent: "flex-end" }}
        >
          {step === "success" ? (
            <>
              <button className="btn btn-ghost">
                View on explorer <Icon.Ext />
              </button>
              <button className="btn btn-primary" onClick={onClose}>Done</button>
            </>
          ) : (
            <button className="btn btn-ghost" disabled style={{ opacity: 0.5 }}>Confirm in wallet…</button>
          )}
        </div>
      </div>
    </div>
  );
};

export const SwapPage = () => {
  const wallet = useWallet();
  const toast = useToast();
  const [from, setFrom] = useState<TokenSymbol>("ETH");
  const [to, setTo] = useState<TokenSymbol>("PGX");
  const [fromAmt, setFromAmt] = useState("1.0");
  const [slippage, setSlippage] = useState(0.5);
  const [deadline, setDeadline] = useState(30);
  const [settings, setSettings] = useState(false);
  const [picker, setPicker] = useState<"from" | "to" | null>(null);
  const [balances, setBalances] = useState<Record<TokenSymbol, number>>(MOCK_BALANCES);
  const [txStep, setTxStep] = useState<"approve" | "confirm" | "pending" | "success" | null>(null);

  const fromTok = tokenBySymbol(from);
  const toTok = tokenBySymbol(to);
  const fromBal = balances[fromTok.balanceKey] ?? 0;
  const toBal = balances[toTok.balanceKey] ?? 0;

  const mid = fromTok.price / toTok.price;
  const feePct = 0.003;
  const parsed = parseFloat(fromAmt) || 0;
  const toAmt = parsed * mid * (1 - feePct);
  const minReceived = toAmt * (1 - slippage / 100);
  const priceImpact = useMemo(() => {
    if (parsed === 0) return 0;
    return parsed * fromTok.price > 5000 ? 0.18 : 0.04;
  }, [parsed, fromTok.price]);

  const flip = () => {
    setFrom(to);
    setTo(from);
    setFromAmt(toAmt > 0 ? toAmt.toFixed(4) : "0");
  };
  const setMax = () => setFromAmt(fromBal.toString());
  const setHalf = () => setFromAmt((fromBal / 2).toString());

  const canSwap = wallet.connected && parsed > 0 && parsed <= fromBal && !txStep;

  const executeSwap = () => {
    if (!wallet.connected) {
      wallet.open();
      return;
    }
    setTxStep("approve");
    setTimeout(() => setTxStep("confirm"), 800);
    setTimeout(() => setTxStep("pending"), 1800);
    setTimeout(() => {
      setTxStep("success");
      setBalances((b) => ({
        ...b,
        [fromTok.balanceKey]: (b[fromTok.balanceKey] ?? 0) - parsed,
        [toTok.balanceKey]: (b[toTok.balanceKey] ?? 0) + toAmt,
      }));
    }, 3200);
  };

  const closeTxModal = () => {
    setTxStep(null);
    toast({ title: "Swap settled", body: `${fmtNum(parsed)} ${from} → ${fmtNum(toAmt)} ${to}` });
  };

  return (
    <main className="container-app" style={{ paddingTop: 40, paddingBottom: 80, paddingLeft: 32, paddingRight: 32, minWidth: 0, overflow: "hidden" }}>
      <div className="swap-grid" style={{ display: "grid", gap: 28 }}>
        <div style={{ minWidth: 0 }}>
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
            <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0, letterSpacing: "-0.01em" }}>Swap</h1>
            <div className="row gap-8">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setSettings(!settings)}
                style={{ padding: 8, borderRadius: 6 }}
              >
                <Icon.Settings />
              </button>
              <button
                className="btn btn-ghost btn-sm"
                style={{ padding: 8, borderRadius: 6 }}
                onClick={() => setFromAmt("")}
              >
                <Icon.Refresh />
              </button>
            </div>
          </div>

          {settings && (
            <div className="panel" style={{ padding: 16, marginBottom: 12 }}>
              <div className="caps" style={{ marginBottom: 10 }}>Slippage tolerance</div>
              <div className="row gap-8">
                {[0.1, 0.5, 1.0].map((v) => (
                  <button
                    key={v}
                    className="btn btn-sm"
                    onClick={() => setSlippage(v)}
                    style={{
                      background: slippage === v ? "var(--accent)" : "var(--bg-2)",
                      color: slippage === v ? "var(--accent-ink)" : "var(--text)",
                      border: "1px solid " + (slippage === v ? "var(--accent)" : "var(--line)"),
                      borderRadius: 6,
                      fontWeight: slippage === v ? 600 : 400,
                    }}
                  >
                    {v}%
                  </button>
                ))}
                <div className="row" style={{ flex: 1, gap: 4 }}>
                  <input
                    className="input"
                    style={{ textAlign: "right", fontSize: 13 }}
                    value={slippage}
                    onChange={(e) => setSlippage(parseFloat(e.target.value) || 0)}
                  />
                  <span className="muted mono" style={{ fontSize: 13 }}>%</span>
                </div>
              </div>
              <div className="caps" style={{ marginTop: 14, marginBottom: 10 }}>Deadline</div>
              <div className="row gap-8">
                <input
                  className="input"
                  type="number"
                  value={deadline}
                  onChange={(e) => setDeadline(parseInt(e.target.value) || 0)}
                />
                <span className="muted" style={{ fontSize: 13 }}>minutes</span>
              </div>
            </div>
          )}

          <div className="panel" style={{ padding: 20, position: "relative" }}>
            <TokenInput
              label="You pay"
              symbol={from}
              amount={fromAmt}
              onAmount={setFromAmt}
              balance={fromBal}
              onPickToken={() => setPicker("from")}
              onMax={setMax}
              onHalf={setHalf}
              isInput
            />
            <div style={{ display: "flex", justifyContent: "center", margin: "-4px 0" }}>
              <button
                onClick={flip}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "var(--panel)",
                  border: "1px solid var(--line)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-2)",
                  position: "relative",
                  zIndex: 1,
                  transition: "transform .2s, border-color .15s",
                }}
              >
                <Icon.Swap size={14} />
              </button>
            </div>
            <TokenInput
              label="You receive"
              symbol={to}
              amount={toAmt > 0 ? toAmt.toFixed(6).replace(/\.?0+$/, "") : ""}
              balance={toBal}
              onPickToken={() => setPicker("to")}
              readOnly
            />

            <div className="hairline" style={{ margin: "16px 0" }} />
            <div className="col gap-8" style={{ fontSize: 13 }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="muted">Rate</span>
                <span className="mono">1 {from} = {fmtNum(mid, 6)} {to}</span>
              </div>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="muted">Minimum received</span>
                <span className="mono">{fmtNum(minReceived, 4)} {to}</span>
              </div>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="muted">Price impact</span>
                <span className="mono" style={{ color: priceImpact > 0.1 ? "var(--warn)" : "var(--text)" }}>
                  {(priceImpact * 100).toFixed(2)}%
                </span>
              </div>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="muted">LP fee</span>
                <span className="mono">{(feePct * 100).toFixed(2)}% · {fmtNum(parsed * feePct)} {from}</span>
              </div>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="muted">Network fee (est.)</span>
                <span className="mono">~$1.82</span>
              </div>
            </div>

            <button
              className="btn btn-primary btn-lg"
              disabled={wallet.connected ? !canSwap : false}
              onClick={executeSwap}
              style={{
                width: "100%",
                marginTop: 18,
                justifyContent: "center",
                opacity: !wallet.connected || canSwap ? 1 : 0.5,
                cursor: !wallet.connected || canSwap ? "pointer" : "not-allowed",
                background: !wallet.connected ? "var(--accent)" : canSwap ? "var(--accent)" : "var(--panel-2)",
                color: !wallet.connected ? "var(--accent-ink)" : canSwap ? "var(--accent-ink)" : "var(--text-3)",
              }}
            >
              {!wallet.connected
                ? "Connect wallet to swap"
                : parsed === 0
                ? "Enter an amount"
                : parsed > fromBal
                ? `Insufficient ${from} balance`
                : txStep
                ? "Swapping…"
                : `Swap ${from} for ${to}`}
            </button>
          </div>

          <div className="row gap-8" style={{ marginTop: 12, fontSize: 12, color: "var(--text-3)" }}>
            <Icon.Shield size={12} />
            <span>MEV protection · 0.30% + routing fee · Settles on-chain</span>
          </div>
          <div className="row gap-8" style={{ marginTop: 8, fontSize: 11, color: "var(--text-3)" }}>
            <span>Swap quotes are illustrative on Sepolia.</span>
          </div>
        </div>

        <div className="col gap-16 swap-side">
          <div className="panel" style={{ padding: 20 }}>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
              <div className="col gap-4">
                <span className="caps">Best route</span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>Via 2 pools · 1 hop</span>
              </div>
              <span className="chip accent">
                <Icon.Bolt size={11} />
                <span>Optimal</span>
              </span>
            </div>
            <Route from={from} to={to} amount={parsed} />
          </div>

          <div className="panel">
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
              <span className="caps">Recent activity</span>
            </div>
            <RecentSwaps />
          </div>
        </div>
      </div>

      {picker && (
        <TokenPicker
          exclude={picker === "from" ? to : from}
          balances={balances}
          onPick={(sym) => {
            if (picker === "from") setFrom(sym);
            else setTo(sym);
            setPicker(null);
          }}
          close={() => setPicker(null)}
        />
      )}

      {txStep && <TxModal from={from} to={to} fromAmt={parsed} toAmt={toAmt} step={txStep} onClose={closeTxModal} />}

    </main>
  );
};
