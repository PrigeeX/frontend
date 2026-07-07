"use client";

import React, { useEffect, useMemo, useState } from "react";
import { parseUnits } from "viem";
import { useAccount, useBalance, useGasPrice, useWaitForTransactionReceipt } from "wagmi";
import { Icon, TokenIcon } from "./icons";
import { useWallet } from "./wallet";
import { useToast } from "./toast";
import { TOKENS, tokenBySymbol, type TokenSymbol } from "@/lib/tokens";
import { fmtNum } from "@/lib/format";
import { dexConfigured, txUrl } from "@/lib/dex";
import { fetchAnalytics, type AnalyticsSwap } from "@/lib/subgraph";
import {
  dexTokenFor,
  useTokenAccount,
  useSwapQuote,
  useSwapActions,
  useDebounced,
  FeeAmount,
  DEX_TOKENS,
} from "@/lib/quote";
import { usePool } from "@/lib/liquidity";
import { useTxQueue } from "@/lib/txqueue";

/** Parse a user amount to wei, tolerant of partial/invalid input. */
const toRaw = (amount: string, decimals: number): bigint => {
  if (!amount) return 0n;
  try {
    return parseUnits(amount, decimals);
  } catch {
    return 0n;
  }
};

// ── Live recent swaps (server analytics aggregator) ──────────────────────────

function useRecentSwaps() {
  const [swaps, setSwaps] = useState<AnalyticsSwap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetch_ = () =>
      fetchAnalytics().then((d) => {
        if (!cancelled) {
          setSwaps(d?.recentSwaps ?? []);
          setLoading(false);
        }
      });

    fetch_();
    const id = setInterval(fetch_, 15_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return { swaps, loading };
}

// ── Components ────────────────────────────────────────────────────────────────

const mapSym = (s: string): TokenSymbol =>
  (s === "WETH" ? "ETH" : s) as TokenSymbol;

const relTime = (ts: string | number) => {
  const diff = Math.floor(Date.now() / 1000) - Number(ts);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
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

const Route = ({ from, to, amount, feePct }: { from: TokenSymbol; to: TokenSymbol; amount: number; feePct: number }) => {
  const hasIntermediary = from !== "PGX" && to !== "PGX";
  const hop = hasIntermediary ? ("PGX" as const) : null;
  const feeLabel = `Pool ${(feePct * 100).toFixed(2)}%`;
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
      <RouteArrow label={feeLabel} />
      {hop && (
        <>
          <RouteNode symbol={hop} label="Routing" />
          <RouteArrow label={feeLabel} />
        </>
      )}
      <RouteNode symbol={to} label={to} right />
    </div>
  );
};

const RecentSwaps = () => {
  const { swaps, loading } = useRecentSwaps();

  if (loading) {
    return (
      <div className="muted" style={{ padding: 40, textAlign: "center", fontSize: 13 }}>
        Loading…
      </div>
    );
  }

  if (swaps.length === 0) {
    return (
      <div className="muted" style={{ padding: 40, textAlign: "center", fontSize: 13 }}>
        No recent swaps
      </div>
    );
  }

  return (
    <div>
      {swaps.map((s, i) => {
        const isZeroIn = s.amount0 > 0;
        const fromSym = mapSym(isZeroIn ? s.token0 : s.token1);
        const toSym = mapSym(isZeroIn ? s.token1 : s.token0);
        const fromAmt = Math.abs(isZeroIn ? s.amount0 : s.amount1);
        const toAmt_ = Math.abs(isZeroIn ? s.amount1 : s.amount0);
        const addr = s.origin
          ? `${s.origin.slice(0, 6)}…${s.origin.slice(-4)}`
          : s.txId.slice(0, 10);

        return (
          <div
            key={s.id}
            className="row"
            style={{
              padding: "12px 20px",
              fontSize: 13,
              borderBottom: i < swaps.length - 1 ? "1px solid var(--line)" : "none",
              gap: 12,
            }}
          >
            <div className="row gap-8">
              <TokenIcon symbol={fromSym} size="sm" />
              <Icon.Arrow size={11} dir="right" />
              <TokenIcon symbol={toSym} size="sm" />
            </div>
            <div className="col gap-4" style={{ flex: 1 }}>
              <span className="mono" style={{ fontSize: 12 }}>
                {fmtNum(fromAmt)} {fromSym} → {fmtNum(toAmt_)} {toSym}
              </span>
              <span className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>{addr}</span>
            </div>
            <span className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>{relTime(s.timestamp)} ago</span>
          </div>
        );
      })}
    </div>
  );
};

const TxModal = ({
  from,
  to,
  fromAmt,
  toAmt,
  step,
  txHash,
  onClose,
}: {
  from: TokenSymbol;
  to: TokenSymbol;
  fromAmt: number;
  toAmt: number;
  step: "approve" | "confirm" | "pending" | "success";
  txHash?: `0x${string}`;
  onClose: () => void;
}) => {
  const { data: receipt } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: Boolean(txHash) },
  });

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
              {receipt ? (
                <>
                  <div className="row" style={{ justifyContent: "space-between", fontSize: 12 }}>
                    <span className="muted">Tx hash</span>
                    <span className="mono">{receipt.transactionHash.slice(0, 6)}&hellip;{receipt.transactionHash.slice(-4)}</span>
                  </div>
                  <div className="row" style={{ justifyContent: "space-between", fontSize: 12 }}>
                    <span className="muted">Block</span>
                    <span className="mono">{receipt.blockNumber.toLocaleString()}</span>
                  </div>
                  <div className="row" style={{ justifyContent: "space-between", fontSize: 12 }}>
                    <span className="muted">Gas used</span>
                    <span className="mono">{receipt.gasUsed.toLocaleString()}</span>
                  </div>
                </>
              ) : (
                <span className="muted" style={{ fontSize: 13 }}>Loading receipt&hellip;</span>
              )}
            </div>
          )}
        </div>
        <div
          className="row gap-8"
          style={{ padding: 16, borderTop: "1px solid var(--line)", justifyContent: "flex-end" }}
        >
          {step === "success" ? (
            <>
              <a
                href={txHash ? txUrl(txHash) : "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost"
              >
                View on explorer <Icon.Ext />
              </a>
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
  const { address } = useAccount();
  const [from, setFrom] = useState<TokenSymbol>("ETH");
  const [to, setTo] = useState<TokenSymbol>("PGX");
  const [fromAmt, setFromAmt] = useState("1.0");
  const [slippage, setSlippage] = useState(0.5);
  const [deadline, setDeadline] = useState(30);
  const [settings, setSettings] = useState(false);
  const [picker, setPicker] = useState<"from" | "to" | null>(null);
  const [txStep, setTxStep] = useState<"approve" | "confirm" | "pending" | "success" | null>(null);
  const [swapTxHash, setSwapTxHash] = useState<`0x${string}` | undefined>();

  const fromTok = tokenBySymbol(from);
  const toTok = tokenBySymbol(to);

  // Real on-chain path: active when both sides map to deployed DEX tokens.
  const realIn = dexTokenFor(from);
  const realOut = dexTokenFor(to);
  const isReal =
    dexConfigured() && Boolean(realIn && realOut) && realIn!.address !== realOut!.address;
  const feeTier = FeeAmount.MEDIUM;
  const feePct = feeTier / 1_000_000;

  const parsed = parseFloat(fromAmt) || 0;
  const amountInRaw = isReal && realIn ? toRaw(fromAmt, realIn.decimals) : 0n;

  const debouncedIn = useDebounced(amountInRaw);
  const realInAcct = useTokenAccount(isReal ? realIn : undefined);
  const realOutAcct = useTokenAccount(isReal ? realOut : undefined);
  const quote = useSwapQuote(isReal ? realIn : undefined, isReal ? realOut : undefined, debouncedIn, feeTier);

  // Always fetch real-token balances for the picker (ETH comes from useBalance).
  const pgxDexToken = DEX_TOKENS.find((t) => t.symbol === "PGX");
  const pgxPickerAcct = useTokenAccount(pgxDexToken);
  const wethPickerAcct = useTokenAccount(DEX_TOKENS.find((t) => t.symbol === "WETH"));
  const tusdcPickerAcct = useTokenAccount(DEX_TOKENS.find((t) => t.symbol === "tUSDC"));
  const tdaiPickerAcct = useTokenAccount(DEX_TOKENS.find((t) => t.symbol === "tDAI"));
  const { data: nativeEth } = useBalance({
    address,
    query: { enabled: Boolean(address), refetchInterval: 12_000 },
  });

  // Live gas price for network fee estimate.
  const { data: gasPrice } = useGasPrice();

  // Live pool for real price impact.
  const { pool: livePool } = usePool(isReal ? realIn : undefined, isReal ? realOut : undefined, feeTier);

  // Picker balances: live for ETH and PGX, zero for undeployed tokens.
  const pickerBalances = useMemo<Record<TokenSymbol, number>>(() => {
    const m = Object.fromEntries(TOKENS.map((t) => [t.symbol, 0])) as Record<TokenSymbol, number>;
    if (address) {
      m.ETH = nativeEth ? Number(nativeEth.value) / 1e18 : 0;
      m.PGX = pgxPickerAcct.balance ?? 0;
      m.WETH = wethPickerAcct.balance ?? 0;
      m.tUSDC = tusdcPickerAcct.balance ?? 0;
      m.tDAI = tdaiPickerAcct.balance ?? 0;
    }
    return m;
  }, [address, nativeEth, pgxPickerAcct.balance, wethPickerAcct.balance, tusdcPickerAcct.balance, tdaiPickerAcct.balance]);

  // Use on-chain balances when real, else 0.
  const fromBal = isReal && realInAcct.balance !== undefined ? realInAcct.balance : 0;
  const toBal = isReal && realOutAcct.balance !== undefined ? realOutAcct.balance : 0;
  const toAmt = isReal ? quote.amountOut ?? 0 : 0;
  const minReceived = toAmt * (1 - slippage / 100);

  const minReceivedRaw = useMemo(() => {
    if (!isReal || !realOut || !quote.amountOutRaw) return 0n;
    return (quote.amountOutRaw * BigInt(Math.round((1 - slippage / 100) * 10_000))) / 10_000n;
  }, [isReal, realOut, quote.amountOutRaw, slippage]);

  // Real price impact: quoted rate vs live pool spot rate.
  const priceImpact = useMemo(() => {
    if (!isReal || !livePool || !realIn || parsed === 0 || toAmt === 0) return undefined;
    const isToken0In = realIn.address.toLowerCase() === livePool.token0.address.toLowerCase();
    const spotRate = parseFloat(
      isToken0In
        ? livePool.token0Price.toSignificant(10)
        : livePool.token1Price.toSignificant(10),
    );
    if (spotRate === 0) return undefined;
    const quotedRate = toAmt / parsed;
    return Math.abs(spotRate - quotedRate) / spotRate;
  }, [isReal, livePool, realIn, parsed, toAmt]);

  // Network fee in ETH from QuoterV2 gas estimate × current gas price.
  const networkFeeEth = useMemo(() => {
    if (!isReal || !quote.gasEstimate || !gasPrice) return undefined;
    return Number(quote.gasEstimate * gasPrice) / 1e18;
  }, [isReal, quote.gasEstimate, gasPrice]);

  const needsApproval =
    isReal && realInAcct.allowance !== undefined && realInAcct.allowance < amountInRaw;

  const queue = useTxQueue();
  const { approve, swap, busy: realBusy } = useSwapActions(() => {
    // An approval mined → the queued swap fires and prompts the wallet again.
    if (queue.advance()) return;
    setTxStep("success");
  });

  const flip = () => {
    setFrom(to);
    setTo(from);
    setFromAmt(toAmt > 0 ? toAmt.toFixed(4) : "0");
  };
  const setMax = () => setFromAmt(fromBal.toString());
  const setHalf = () => setFromAmt((fromBal / 2).toString());

  const canSwap = wallet.connected && isReal && parsed > 0 && parsed <= fromBal && !txStep && toAmt > 0;

  const executeSwap = () => {
    if (!wallet.connected) {
      wallet.open();
      return;
    }
    if (!isReal || !realIn || !realOut) return;

    const doSwap = () => {
      setTxStep("pending");
      swap(realIn, realOut, amountInRaw, minReceivedRaw, feeTier, {
        onSuccess: (hash) => {
          setSwapTxHash(hash);
          toast({ title: "Swap submitted", body: "View on explorer", href: txUrl(hash) });
        },
        onError: (e) => { queue.clear(); setTxStep(null); toast({ title: "Swap failed", body: e.message, kind: "error" }); },
      }, quote.route ?? "direct");
    };

    if (needsApproval) {
      setTxStep("approve");
      queue.start([
        () =>
          approve(realIn, amountInRaw, {
            onSuccess: () => toast({ title: "Approve submitted", body: `Authorizing ${realIn.symbol} - swap follows automatically` }),
            onError: (e) => { queue.clear(); setTxStep(null); toast({ title: "Approve failed", body: e.message, kind: "error" }); },
          }),
        doSwap,
      ]);
      return;
    }
    doSwap();
  };

  const closeTxModal = () => {
    setTxStep(null);
    setSwapTxHash(undefined);
    toast({ title: "Swap settled", body: `${fmtNum(parsed)} ${from} → ${fmtNum(toAmt)} ${to}` });
  };

  return (
    <div style={{ minWidth: 0 }}>
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
                <span className="mono">
                  {isReal && parsed > 0 && toAmt > 0
                    ? `1 ${from} = ${fmtNum(toAmt / parsed, 6)} ${to}`
                    : "-"}
                </span>
              </div>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="muted">Minimum received</span>
                <span className="mono">{isReal && toAmt > 0 ? `${fmtNum(minReceived, 4)} ${to}` : "-"}</span>
              </div>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="muted">Price impact</span>
                <span className="mono" style={{ color: (priceImpact ?? 0) > 0.01 ? "var(--warn)" : "var(--text)" }}>
                  {priceImpact !== undefined ? `${(priceImpact * 100).toFixed(2)}%` : "-"}
                </span>
              </div>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="muted">LP fee</span>
                <span className="mono">
                  {isReal && parsed > 0
                    ? `${(feePct * 100).toFixed(2)}% · ${fmtNum(parsed * feePct)} ${from}`
                    : "-"}
                </span>
              </div>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="muted">Network fee (est.)</span>
                <span className="mono">
                  {networkFeeEth !== undefined ? `~${networkFeeEth.toFixed(6)} ETH` : "-"}
                </span>
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
                : !isReal
                ? "No live pool for this pair"
                : parsed === 0
                ? "Enter an amount"
                : parsed > fromBal
                ? `Insufficient ${from} balance`
                : quote.noRoute
                ? "No route for this pair"
                : txStep || realBusy
                ? "Swapping…"
                : needsApproval
                ? `Approve & swap ${from} for ${to}`
                : `Swap ${from} for ${to}`}
            </button>
          </div>

          <div className="row gap-8" style={{ marginTop: 12, fontSize: 12, color: "var(--text-3)" }}>
            <Icon.Shield size={12} />
            <span>MEV protection · {(feePct * 100).toFixed(2)}% + routing fee · Settles on-chain</span>
          </div>
          <div className="row gap-8" style={{ marginTop: 8, fontSize: 11, color: "var(--text-3)" }}>
            <span>{isReal ? "Live quote from QuoterV2 - settles on-chain via the router." : "This pair has no live pool on this deployment."}</span>
          </div>
        </div>

        <div className="col gap-16 swap-side">
          <div className="panel" style={{ padding: 20 }}>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
              <div className="col gap-4">
                <span className="caps">Best route</span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>
                  {!isReal
                    ? "No live route"
                    : quote.route === "viaWeth"
                      ? "Via 2 pools · WETH hop"
                      : "Via 1 pool · direct"}
                </span>
              </div>
              <span className="chip accent">
                <Icon.Bolt size={11} />
                <span>Optimal</span>
              </span>
            </div>
            <Route from={from} to={to} amount={parsed} feePct={feePct} />
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
          balances={pickerBalances}
          onPick={(sym) => {
            if (picker === "from") setFrom(sym);
            else setTo(sym);
            setPicker(null);
          }}
          close={() => setPicker(null)}
        />
      )}

      {txStep && (
        <TxModal
          from={from}
          to={to}
          fromAmt={parsed}
          toAmt={toAmt}
          step={txStep}
          txHash={swapTxHash}
          onClose={closeTxModal}
        />
      )}
    </div>
  );
};
