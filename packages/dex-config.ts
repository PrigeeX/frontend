// =============================================================================
// PrigeeX DEX config - single source of truth for every on-chain address and
// subgraph endpoint. Kept here (not in .env) so the whole deployment is
// version-controlled and readable in one place.
//
// Network: Arbitrum Sepolia (chain id 421614)
// Deployer: 0x3816BA21dCC9dfD3C714fFDB987163695408653F
// =============================================================================

import { arbitrumSepolia } from "wagmi/chains";

/** The chain the dApp talks to. */
export const DEX_CHAIN = arbitrumSepolia;

/**
 * RPC URL, context-aware so the Alchemy key never reaches the browser:
 *   - Server-side (SSR): reads the private RPC_URL env var directly.
 *   - Browser: routes through the /api/rpc Next.js proxy.
 * Set RPC_URL (no NEXT_PUBLIC prefix) in .env.local.
 */
export function getRpcUrl(): string {
  if (typeof window === "undefined") {
    return process.env.RPC_URL || "http://localhost:8545";
  }
  return `${window.location.origin}/api/rpc`;
}

/** Block explorer base for tx links. */
export const EXPLORER_URL = "https://sepolia.arbiscan.io";

// ── Contract addresses (Arbitrum Sepolia deployment) ─────────────────────────
export const ADDRESSES = {
  // Core infrastructure
  weth9:           "0x980B62Da83eFf3D4576C647993b0c1D7faf17c73",
  permit2:         "0x000000000022D473030F116dDEE9F6B43aC78BA3",

  // PrigeeX protocol
  PGX:             "0x1f3F0cE32DDca29DC1861796e71C9D4530666AA4",
  twapOracle:      "0xba1009de3D10b304302C37616c143CF63A2b307c",
  staking:         "0x5837cff2EDc2fC929bf418e2E1fA5b50bcB3572C", // proxy
  feeDistributor:  "0x518fD25a207790A4405f5c217F448EF67F73456C",

  // V3 AMM (concentrated liquidity)
  v3Factory:       "0xAcbfF1d4e38968E8A3E37f3fdAd2B45c4283279f",
  swapRouter:      "0x53B2cc9Df30e321fF13A618FA74916A404735C62",
  positionManager: "0x1F4533B292E4d29fd1B17Fbc6B955Ded1A8bac32",
  quoterV2:        "0x9252Fb68418A305ba7C31a8CCAf25707A9EF5591",
  tickLens:        "0x9595B4DF1912982f835815fB757DAafd1397b141",
  multicall:       "0x866Aae3B125eB1f0f2770a2eA495C83DD70D0b16",
  universalRouter: "0x78AFf5b449312ab225Db942Ff5466513D9f769DF",

  // V2 AMM (legacy constant-product pairs)
  v2Factory:       "0xE2C7552726753a55ab2032C43B526Ff788c52A77",
  v2Router:        "0xFF7e218FEfB3099A63CAB52AB81d2AD81bc9E48b",

  // Testnet-only ERC20s (PrigeeXSeedERC20), paired with WETH on V2 + V3
  tUSDC:           "0x828B8fAF6c38eB666dFA8c1F22b106ca1FCecf0c", // 6 decimals
  tDAI:            "0xDD8A20b1ABbD84a52d02Dc623E756E880FB13b6b", // 18 decimals
} as const satisfies Record<string, `0x${string}`>;

// ── Subgraph endpoints ────────────────────────────────────────────────────────
// All subgraph queries go through the Next.js proxy routes so private Goldsky
// URLs and bearer tokens never reach the browser. Actual upstream URLs live in
// server-only env vars (SUBGRAPH_URL_V3/V2/PROTOCOL + SUBGRAPH_BEARER_TOKEN).
export const SUBGRAPHS = {
  v3:       "/api/subgraph/v3",
  v2:       "/api/subgraph/v2",
  protocol: "/api/subgraph/protocol",
};

export type DexAddressKey = keyof typeof ADDRESSES;
