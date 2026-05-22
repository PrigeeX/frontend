import React from "react";

type IconProps = { size?: number };

export const Icon = {
  Logo: ({ size = 24 }: IconProps) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/image.png"
      alt="PrigeeX"
      width={size}
      height={size}
      style={{ display: "block", width: size, height: size, objectFit: "contain" }}
    />
  ),
  Arrow: ({ size = 16, dir = "right" }: IconProps & { dir?: "right" | "down" | "left" | "up" }) => {
    const rot = { right: 0, down: 90, left: 180, up: 270 }[dir];
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ transform: `rotate(${rot}deg)` }}>
        <path d="M3 8h10m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
      </svg>
    );
  },
  Swap: ({ size = 16 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M4 3v10m0 0l-2-2m2 2l2-2M12 13V3m0 0l-2 2m2-2l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  ),
  Check: ({ size = 14 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M2 7.5l3 3L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
    </svg>
  ),
  Close: ({ size = 16 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  ),
  Copy: ({ size = 14 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="5" y="5" width="8" height="9" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 11V3a1 1 0 011-1h7" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  Ext: ({ size = 12 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <path d="M4 2h6v6M10 2L4 8M2 5v5h5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  Menu: ({ size = 18 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path d="M3 5h12M3 9h12M3 13h12" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  Wallet: ({ size = 16 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="4" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 7h12" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="11" cy="10" r="1" fill="currentColor" />
    </svg>
  ),
  Spark: ({ size = 16 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M8 2l1.5 4.5L14 8l-4.5 1.5L8 14l-1.5-4.5L2 8l4.5-1.5L8 2z" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  ),
  Shield: ({ size = 16 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M8 2l5 2v4c0 3-2 5-5 6-3-1-5-3-5-6V4l5-2z" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  Bolt: ({ size = 16 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M9 2L3 9h4l-1 5 6-7H8l1-5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  ),
  Lock: ({ size = 14 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <rect x="3" y="6" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 6V4a2 2 0 014 0v2" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  ),
  Gift: ({ size = 16 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="6" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 9h12M8 6v8M5.5 6a2 2 0 010-4c1.5 0 2.5 2 2.5 4m0 0c0-2 1-4 2.5-4a2 2 0 010 4" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  Globe: ({ size = 14 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1.5 7h11M7 1.5c2 2 2 9 0 11M7 1.5c-2 2-2 9 0 11" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  ),
  Settings: ({ size = 16 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 1v2m0 10v2M1 8h2m10 0h2M3.05 3.05l1.4 1.4m7.1 7.1l1.4 1.4M3.05 12.95l1.4-1.4m7.1-7.1l1.4-1.4" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  Refresh: ({ size = 16 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M3 8a5 5 0 019-3M13 8a5 5 0 01-9 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" />
      <path d="M12 2v3h-3M4 14v-3h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" />
    </svg>
  ),
  /** Inline PrigeeX icon for use after "Prigee" text. Full icon with dark bg + gradient X. */
  XMark: ({ size = 18 }: IconProps) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/prigeex-x-inline.svg"
      alt="X"
      width={size}
      height={size}
      style={{
        display: "inline-block",
        width: size,
        height: size,
        objectFit: "contain",
        verticalAlign: "middle",
        borderRadius: size * 0.22,
      }}
    />
  ),
};

const TokenGlyph = ({ symbol, s }: { symbol: string; s: number }) => {
  switch (symbol) {
    case "PGX": {
      const bgId = `pgx-tok-bg-${s}`;
      const xFrontId = `pgx-tok-xf-${s}`;
      const xBackId = `pgx-tok-xb-${s}`;
      const e1 = `pgx-tok-e1-${s}`;
      const e2 = `pgx-tok-e2-${s}`;
      return (
        <svg width={s} height={s} viewBox="0 0 120 120">
          <defs>
            <linearGradient id={bgId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0B2A6B" />
              <stop offset="100%" stopColor="#03102E" />
            </linearGradient>
            <linearGradient id={xFrontId} x1="0.5" y1="0" x2="0.5" y2="1">
              <stop offset="0%" stopColor="#7CC2FF" />
              <stop offset="20%" stopColor="#2F8AF0" />
              <stop offset="45%" stopColor="#1670E8" />
              <stop offset="75%" stopColor="#0B3FA8" />
              <stop offset="100%" stopColor="#020828" />
            </linearGradient>
            <linearGradient id={xBackId} x1="0.5" y1="0" x2="0.5" y2="1">
              <stop offset="0%" stopColor="#3A8CE0" />
              <stop offset="35%" stopColor="#1058C8" />
              <stop offset="70%" stopColor="#062B84" />
              <stop offset="100%" stopColor="#010516" />
            </linearGradient>
            <linearGradient id={e1} x1="30" y1="16" x2="106" y2="92" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F4FBFF" stopOpacity="1" />
              <stop offset="45%" stopColor="#65B8FF" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#020828" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={e2} x1="94" y1="16" x2="18" y2="92" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#EAF6FF" stopOpacity="0.9" />
              <stop offset="45%" stopColor="#4FA2F3" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#020828" stopOpacity="0" />
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r="58" fill={`url(#${bgId})`} stroke="#1A3470" strokeWidth="1.5" />
          <path d="M94 16 L106 28 L30 104 L18 92 Z" fill={`url(#${xBackId})`} />
          <path d="M94 16 L18 92 L20.12 94.12 L96.12 18.12 Z" fill={`url(#${e2})`} />
          <path d="M18 28 L30 16 L106 92 L94 104 Z" fill={`url(#${xFrontId})`} />
          <path d="M30 16 L106 92 L103.88 94.12 L27.88 18.12 Z" fill={`url(#${e1})`} />
        </svg>
      );
    }
    case "ETH":
      return (
        <svg width={s} height={s} viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="14" fill="#343434" />
          <path d="M16 5 L16 13.2 L22.5 16.1 Z" fill="#fff" opacity="0.7" />
          <path d="M16 5 L9.5 16.1 L16 13.2 Z" fill="#fff" />
          <path d="M16 21.5 L16 27 L22.5 17.6 Z" fill="#fff" opacity="0.7" />
          <path d="M16 27 L16 21.5 L9.5 17.6 Z" fill="#fff" />
          <path d="M16 20.3 L22.5 16.3 L16 13.4 Z" fill="#fff" opacity="0.45" />
          <path d="M9.5 16.3 L16 20.3 L16 13.4 Z" fill="#fff" opacity="0.8" />
        </svg>
      );
    case "USDC":
      return (
        <svg width={s} height={s} viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="14" fill="#2775CA" />
          <text x="16" y="20.5" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff" fontFamily="Geist, sans-serif">$</text>
          <circle cx="16" cy="16" r="9" fill="none" stroke="#fff" strokeWidth="1.2" opacity="0.55" />
        </svg>
      );
    case "USDT":
      return (
        <svg width={s} height={s} viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="14" fill="#26A17B" />
          <path d="M10 10 h12 v3 h-4.5 v2.3 c3 .15 5 .65 5 1.2 0 .55-2 1.05-5 1.2v5.3h-3v-5.3c-3-.15-5-.65-5-1.2 0-.55 2-1.05 5-1.2V13H10z" fill="#fff" />
        </svg>
      );
    case "WBTC":
      return (
        <svg width={s} height={s} viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="14" fill="#fff" />
          <circle cx="16" cy="16" r="11" fill="#F7931A" />
          <text x="16" y="20.5" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff" fontFamily="Geist, sans-serif">₿</text>
        </svg>
      );
    case "DAI":
      return (
        <svg width={s} height={s} viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="14" fill="#F5AC37" />
          <path d="M9 11 h7.5 c3.5 0 6 2 6.5 4 H23 v1.2 h-0.1 c-0.5 2-3 4-6.4 4H9v-2h1.8v-5.2H9z M12.5 13 v6.2h3.9 c2.2 0 3.8-1.3 4.2-3.1H13.5v-1.2h6.9c-.4-1.7-2-3-4.2-3z" fill="#fff" />
        </svg>
      );
    case "ARB":
      return (
        <svg width={s} height={s} viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="14" fill="#213147" />
          <path d="M14.5 9 l-5.5 12 h2.8 l1.2-2.8 h4.7 l1.2 2.8 h2.8 l-5.5-12 z m-.3 7 l1.5-3.5 1.5 3.5 z" fill="#28A0F0" />
          <path d="M20 12.5 l3.5 8.5 h-1.5 l-3-7.5 z" fill="#fff" opacity="0.85" />
        </svg>
      );
    case "OP":
      return (
        <svg width={s} height={s} viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="14" fill="#FF0420" />
          <path d="M10 13.8 a3.2 3.2 0 013.2-3.2h1.3a3.2 3.2 0 013.2 3.2v0.8a3.2 3.2 0 01-3.2 3.2h-1.3a3.2 3.2 0 01-3.2-3.2z m3.2-1.3a1.3 1.3 0 00-1.3 1.3v0.8a1.3 1.3 0 001.3 1.3h1.3a1.3 1.3 0 001.3-1.3v-0.8a1.3 1.3 0 00-1.3-1.3z" fill="#fff" />
          <path d="M19 17.2h3.2a2.8 2.8 0 010 5.6h-1.6v-1.9h1.6a0.9 0.9 0 000-1.8H19z" fill="#fff" />
        </svg>
      );
    default:
      return (
        <svg width={s} height={s} viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="14" fill="var(--panel-2)" stroke="var(--line-2)" />
          <text x="16" y="20" textAnchor="middle" fontSize="10" fill="var(--text)" fontFamily="Geist Mono, monospace">{symbol?.slice(0, 3)}</text>
        </svg>
      );
  }
};

export const TokenIcon = ({ symbol, size = "md" }: { symbol: string; size?: "sm" | "md" | "lg" }) => {
  const px = size === "sm" ? 22 : size === "lg" ? 36 : 28;
  return (
    <span
      style={{
        width: px,
        height: px,
        borderRadius: "50%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      <TokenGlyph symbol={symbol} s={px} />
    </span>
  );
};
