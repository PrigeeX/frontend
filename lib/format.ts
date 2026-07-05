export const shortAddr = (a?: string | null) =>
  a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "";

export const fmtNum = (n: number | null | undefined, decimals = 4) => {
  if (n === null || n === undefined || isNaN(n)) return "-";
  if (n === 0) return "0";
  // Sub-0.0001 prices (e.g. PGX priced in WETH) still need to be readable and
  // distinguishable, so fall back to significant digits instead of clamping.
  if (n < 1e-9) return "<0.000000001";
  if (n < 0.0001) return n.toLocaleString(undefined, { maximumSignificantDigits: 4 });
  if (n > 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n > 1e3) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: decimals });
};

export const fmtUsd = (n: number | null | undefined) => "$" + fmtNum(n, 2);
