"use client";

// Uniswap-v3-style liquidity-depth chart (FE-17). Renders a histogram of
// liquidity across price, with the current price marked and two draggable
// handles bounding the selected range. Bespoke SVG - no chart dependency.
//
// Presentational + interactive only: it takes depth `bars`, the current price
// and the selected [min,max], and reports drags back via onChange. Bars are
// supplied by the parent (from on-chain tick data, or a representative curve
// when a pool has no liquidity yet).

import React, { useCallback, useRef } from "react";

export type DepthBar = { price: number; liquidity: number };

const W = 520;
const H = 200;
const PAD = { top: 16, bottom: 28, left: 8, right: 8 };

export function RangeChart({
  bars,
  current,
  min,
  max,
  onChange,
  symbol1,
}: {
  bars: DepthBar[];
  current: number;
  min: number;
  max: number;
  onChange: (next: { min?: number; max?: number }) => void;
  symbol1?: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  // Price domain padded slightly beyond the data and the selected range.
  const prices = bars.map((b) => b.price);
  const lo = Math.min(...prices, min, current) * 0.92;
  const hi = Math.max(...prices, max, current) * 1.08;
  const maxLiq = Math.max(...bars.map((b) => b.liquidity), 1);

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const xOf = useCallback(
    (price: number) => PAD.left + ((price - lo) / (hi - lo)) * plotW,
    [lo, hi, plotW],
  );
  const priceAt = useCallback(
    (x: number) => lo + ((x - PAD.left) / plotW) * (hi - lo),
    [lo, hi, plotW],
  );
  const yOf = (liq: number) => PAD.top + plotH - (liq / maxLiq) * plotH;

  const startDrag = (handle: "min" | "max") => (e: React.PointerEvent) => {
    e.preventDefault();
    const move = (ev: PointerEvent) => {
      const rect = svgRef.current!.getBoundingClientRect();
      const x = ((ev.clientX - rect.left) / rect.width) * W;
      const price = Math.max(lo, Math.min(hi, priceAt(x)));
      if (handle === "min") onChange({ min: Math.min(price, max) });
      else onChange({ max: Math.max(price, min) });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const barW = Math.max(1.5, (plotW / bars.length) * 0.82);
  const xMin = xOf(min);
  const xMax = xOf(max);
  const xCur = xOf(current);

  return (
    <div style={{ width: "100%" }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", touchAction: "none", userSelect: "none" }}
      >
        {/* Selected-range band */}
        <rect
          x={xMin}
          y={PAD.top}
          width={Math.max(0, xMax - xMin)}
          height={plotH}
          fill="color-mix(in oklch, var(--accent) 12%, transparent)"
        />

        {/* Depth bars - warm inside the selected range, dim outside */}
        {bars.map((b, i) => {
          const x = xOf(b.price);
          const inRange = b.price >= min && b.price <= max;
          return (
            <rect
              key={i}
              x={x - barW / 2}
              y={yOf(b.liquidity)}
              width={barW}
              height={PAD.top + plotH - yOf(b.liquidity)}
              rx={1}
              fill={inRange ? "var(--accent)" : "var(--line-2)"}
              opacity={inRange ? 0.85 : 0.5}
            />
          );
        })}

        {/* Current price marker */}
        <line x1={xCur} y1={PAD.top - 6} x2={xCur} y2={PAD.top + plotH} stroke="var(--text)" strokeWidth={1} strokeDasharray="3 3" opacity={0.7} />
        <text x={xCur} y={PAD.top - 9} textAnchor="middle" fontSize={9} fill="var(--text-2)" className="mono">
          {fmtPrice(current)}
        </text>

        {/* Draggable handles */}
        {(["min", "max"] as const).map((side) => {
          const x = side === "min" ? xMin : xMax;
          const price = side === "min" ? min : max;
          return (
            <g key={side} style={{ cursor: "ew-resize" }} onPointerDown={startDrag(side)}>
              <line x1={x} y1={PAD.top - 4} x2={x} y2={PAD.top + plotH + 4} stroke="var(--accent)" strokeWidth={1.5} />
              <rect x={x - 5} y={PAD.top + plotH / 2 - 12} width={10} height={24} rx={3} fill="var(--accent)" />
              <line x1={x - 1.5} y1={PAD.top + plotH / 2 - 6} x2={x - 1.5} y2={PAD.top + plotH / 2 + 6} stroke="var(--accent-ink)" strokeWidth={1} />
              <line x1={x + 1.5} y1={PAD.top + plotH / 2 - 6} x2={x + 1.5} y2={PAD.top + plotH / 2 + 6} stroke="var(--accent-ink)" strokeWidth={1} />
              <text x={x} y={H - 8} textAnchor="middle" fontSize={9} fill="var(--accent)" className="mono">
                {fmtPrice(price)}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="row" style={{ justifyContent: "space-between", fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
        <span>Liquidity depth</span>
        {symbol1 && <span className="mono">price in {symbol1}</span>}
      </div>
    </div>
  );
}

const fmtPrice = (n: number) => {
  if (!isFinite(n)) return "∞";
  if (n === 0) return "0";
  if (n < 0.001) return n.toExponential(1);
  if (n < 1) return n.toPrecision(3);
  if (n < 1000) return n.toFixed(2);
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
};
