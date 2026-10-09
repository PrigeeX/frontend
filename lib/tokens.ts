"use client";

// Swap-picker token list for the active network (packages/dex-config.ts): native
// ETH plus every listed DEX token. USD prices are live, from the analytics
// aggregator (/api/analytics), never hardcoded.

import { useEffect, useState } from "react";
import { DEX_TOKEN_LIST, ADDRESSES } from "@/packages/dex-config";
import { fetchAnalytics } from "./subgraph";

export type TokenSymbol = string;

export type Token = {
  symbol: TokenSymbol;
  name: string;
  balanceKey: TokenSymbol;
};

export const TOKENS: Token[] = [
  { symbol: "ETH", name: "Ethereum", balanceKey: "ETH" },
  ...DEX_TOKEN_LIST.map((t) => ({ symbol: t.symbol, name: t.name, balanceKey: t.symbol })),
];

export const tokenBySymbol = (s: TokenSymbol): Token =>
  TOKENS.find((t) => t.symbol === s) ?? TOKENS[0];

// One shared fetch for every component that needs prices.
let priceCache: { at: number; data: Record<TokenSymbol, number> } | undefined;
let pricePending: Promise<Record<TokenSymbol, number>> | undefined;
const PRICE_TTL_MS = 30_000;

async function loadPrices(): Promise<Record<TokenSymbol, number>> {
  if (priceCache && Date.now() - priceCache.at < PRICE_TTL_MS) return priceCache.data;
  pricePending ??= fetchAnalytics()
    .then((snap) => {
      const byAddr = snap?.prices ?? {};
      const out: Record<TokenSymbol, number> = {};
      for (const t of DEX_TOKEN_LIST) out[t.symbol] = byAddr[t.address.toLowerCase()] ?? 0;
      out.ETH = byAddr[ADDRESSES.weth9.toLowerCase()] ?? 0;
      priceCache = { at: Date.now(), data: out };
      return out;
    })
    .finally(() => (pricePending = undefined));
  return pricePending;
}

/** Live USD price per symbol (0 until a priced pool exists for the token). */
export function useUsdPrices(): Record<TokenSymbol, number> {
  const [prices, setPrices] = useState<Record<TokenSymbol, number>>(priceCache?.data ?? {});
  useEffect(() => {
    let cancelled = false;
    const tick = () => loadPrices().then((p) => !cancelled && setPrices(p)).catch(() => {});
    tick();
    const id = setInterval(tick, PRICE_TTL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);
  return prices;
}
