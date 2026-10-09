// =============================================================================
// PrigeeX DEX config - single source of truth for every on-chain address and
// subgraph endpoint. Kept here (not in .env) so the whole deployment is
// version-controlled and readable in one place.
//
// One codebase, one network per deployment:
//   - app.prigeex.com      -> Arbitrum One (chain id 42161), the default
//   - testnet.prigeex.com  -> Arbitrum Sepolia (chain id 421614), selected by
//                             building with NEXT_PUBLIC_PRIGEEX_NETWORK=arbitrum-sepolia
// =============================================================================

import { arbitrum, arbitrumSepolia } from "wagmi/chains";

type Hex = `0x${string}`;

export type NetworkKey = "arbitrum-one" | "arbitrum-sepolia";

/** A token the DEX lists on a network (feeds the swap picker and LP selectors). */
export type DexTokenInfo = {
  symbol: string;
  name: string;
  address: Hex;
  decimals: number;
};

type Deployment = {
  key: NetworkKey;
  chain: typeof arbitrum | typeof arbitrumSepolia;
  explorerUrl: string;
  /** Public fallback RPCs, used only when RPC_URL / RPC_LOGS_URL are unset. */
  defaultRpcUrl: string;
  defaultLogsRpcUrl: string;
  /** PrigeeXV3Factory creation block - floor for historical log sweeps. */
  v3StartBlock: bigint;
  /** Fallback subgraph URLs, used only when SUBGRAPH_URL_* are unset. */
  defaultSubgraphs: { v3: string; v2: string; protocol: string };
  addresses: {
    weth9: Hex;
    permit2: Hex;
    PGX: Hex;
    twapOracle: Hex;
    staking: Hex;
    feeDistributor: Hex;
    v3Factory: Hex;
    swapRouter: Hex;
    positionManager: Hex;
    quoterV2: Hex;
    tickLens: Hex;
    multicall: Hex;
    universalRouter: Hex;
    v2Factory: Hex;
    v2Router: Hex;
  };
  /** Tokens listed in the UI. PGX and WETH first, then the stablecoins. */
  tokens: DexTokenInfo[];
  /** Stablecoins valued at $1 when deriving USD prices. */
  stablecoins: Hex[];
  /** Stablecoin whose WETH pool sets the ETH/USD price for analytics. */
  usdAnchor: Hex;
};

// ── Arbitrum One (release 1.0.0, deployed 3 Oct 2026) ────────────────────────
// Source: PrigeeX_contracts docs/deployments/arb-one.md
// Owner / treasury: Safe 0x9b7c43D101F9C0d8BAd15986560b76B07322C566
const ARBITRUM_ONE: Deployment = {
  key: "arbitrum-one",
  chain: arbitrum,
  explorerUrl: "https://arbiscan.io",
  defaultRpcUrl: "https://arb1.arbitrum.io/rpc",
  defaultLogsRpcUrl: "https://arb1.arbitrum.io/rpc",
  v3StartBlock: 511_345_519n,
  defaultSubgraphs: {
    v3: "https://api.goldsky.com/api/public/project_cmub9id085en401qr5brzdsr1/subgraphs/prigeex-v3-subgraph/1.0.0/gn",
    v2: "https://api.goldsky.com/api/public/project_cmub9id085en401qr5brzdsr1/subgraphs/prigeex-v2-subgraph/1.0.0/gn",
    protocol: "https://api.goldsky.com/api/public/project_cmub9id085en401qr5brzdsr1/subgraphs/prigeex-protocol-subgraph/1.0.0/gn",
  },
  addresses: {
    // Core infrastructure (canonical)
    weth9:           "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    permit2:         "0x000000000022D473030F116dDEE9F6B43aC78BA3",

    // PrigeeX protocol
    PGX:             "0xccaCF9B9Ad6522B96FbE9a7f8EEaEAeDafC7C45c",
    twapOracle:      "0x9FA7Dc298BAb2EF4073dD781e509a277C54Fffa2",
    staking:         "0xAafA05267af88E59A29608352049F90b3A561C9E", // proxy
    feeDistributor:  "0x649F3ca2e69ADaE7f962A9748b1234F6C07AC255",

    // V3 AMM (concentrated liquidity)
    v3Factory:       "0xbbf0B4caA45f99304c8aC0fAa35559095FAAe843",
    swapRouter:      "0x52E2Ee8f8954Eb37bcB6f64c9B888d60940a8C47",
    positionManager: "0xBc5064Eb09B3c26a99c56BAC97FCa214224B2065",
    quoterV2:        "0x4c015E70735A5734932bDa4146bC1280c6E6f726",
    tickLens:        "0x15d9d585Fa5637b8159f1A3C7b17249F6A47b2F7",
    multicall:       "0xaA7223C18A81A7fE3E7463c6997c6b1C43Ef6906",
    universalRouter: "0x8E51f37F0Ce485d12dB526DD31Beb483a76572C6",

    // V2 AMM (classic constant-product pairs)
    v2Factory:       "0xe2e3e4AC1ecbF4CaF90d32641BA09e625e6238ef",
    v2Router:        "0x9e974568dfaF8e475e749782Dfd0216Ab7B2A1a0",
  },
  tokens: [
    { symbol: "PGX",  name: "PrigeeX",       address: "0xccaCF9B9Ad6522B96FbE9a7f8EEaEAeDafC7C45c", decimals: 18 },
    { symbol: "WETH", name: "Wrapped Ether", address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", decimals: 18 },
    { symbol: "USDC", name: "USD Coin",      address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", decimals: 6 },
    { symbol: "USDT", name: "Tether USD",    address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", decimals: 6 },
    { symbol: "DAI",  name: "Dai",           address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", decimals: 18 },
  ],
  stablecoins: [
    "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
  ],
  usdAnchor: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
};

// ── Arbitrum Sepolia (testnet, served at testnet.prigeex.com) ────────────────
// Deployer: 0x3816BA21dCC9dfD3C714fFDB987163695408653F
const ARBITRUM_SEPOLIA: Deployment = {
  key: "arbitrum-sepolia",
  chain: arbitrumSepolia,
  explorerUrl: "https://sepolia.arbiscan.io",
  defaultRpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
  defaultLogsRpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
  v3StartBlock: 280_307_048n,
  // No hosted default: point SUBGRAPH_URL_* at the testnet subgraphs, or run a
  // local graph-node.
  defaultSubgraphs: {
    v3: "http://localhost:8000/subgraphs/name/prigeex-v3-arbitrum-sepolia",
    v2: "http://localhost:8000/subgraphs/name/prigeex-v2-arbitrum-sepolia",
    protocol: "http://localhost:8000/subgraphs/name/prigeex-protocol-subgraph",
  },
  addresses: {
    weth9:           "0x980B62Da83eFf3D4576C647993b0c1D7faf17c73",
    permit2:         "0x000000000022D473030F116dDEE9F6B43aC78BA3",

    PGX:             "0x1f3F0cE32DDca29DC1861796e71C9D4530666AA4",
    twapOracle:      "0xba1009de3D10b304302C37616c143CF63A2b307c",
    staking:         "0x5837cff2EDc2fC929bf418e2E1fA5b50bcB3572C", // proxy
    feeDistributor:  "0x518fD25a207790A4405f5c217F448EF67F73456C",

    v3Factory:       "0xAcbfF1d4e38968E8A3E37f3fdAd2B45c4283279f",
    swapRouter:      "0x53B2cc9Df30e321fF13A618FA74916A404735C62",
    positionManager: "0x1F4533B292E4d29fd1B17Fbc6B955Ded1A8bac32",
    quoterV2:        "0x9252Fb68418A305ba7C31a8CCAf25707A9EF5591",
    tickLens:        "0x9595B4DF1912982f835815fB757DAafd1397b141",
    multicall:       "0x866Aae3B125eB1f0f2770a2eA495C83DD70D0b16",
    universalRouter: "0x78AFf5b449312ab225Db942Ff5466513D9f769DF",

    v2Factory:       "0xE2C7552726753a55ab2032C43B526Ff788c52A77",
    v2Router:        "0xFF7e218FEfB3099A63CAB52AB81d2AD81bc9E48b",
  },
  // Testnet-only ERC20s (PrigeeXSeedERC20), paired with WETH on V2 + V3
  tokens: [
    { symbol: "PGX",   name: "PrigeeX",       address: "0x1f3F0cE32DDca29DC1861796e71C9D4530666AA4", decimals: 18 },
    { symbol: "WETH",  name: "Wrapped Ether", address: "0x980B62Da83eFf3D4576C647993b0c1D7faf17c73", decimals: 18 },
    { symbol: "tUSDC", name: "Test USD Coin", address: "0x828B8fAF6c38eB666dFA8c1F22b106ca1FCecf0c", decimals: 6 },
    { symbol: "tDAI",  name: "Test Dai",      address: "0xDD8A20b1ABbD84a52d02Dc623E756E880FB13b6b", decimals: 18 },
  ],
  stablecoins: [
    "0x828B8fAF6c38eB666dFA8c1F22b106ca1FCecf0c",
    "0xDD8A20b1ABbD84a52d02Dc623E756E880FB13b6b",
  ],
  usdAnchor: "0x828B8fAF6c38eB666dFA8c1F22b106ca1FCecf0c",
};

const DEPLOYMENTS: Record<NetworkKey, Deployment> = {
  "arbitrum-one": ARBITRUM_ONE,
  "arbitrum-sepolia": ARBITRUM_SEPOLIA,
};

/**
 * Active network. Inlined at build time, so the testnet deployment is a
 * separate build with NEXT_PUBLIC_PRIGEEX_NETWORK=arbitrum-sepolia. Anything
 * else (including unset) is Arbitrum One.
 */
export const NETWORK: NetworkKey =
  process.env.NEXT_PUBLIC_PRIGEEX_NETWORK === "arbitrum-sepolia" ? "arbitrum-sepolia" : "arbitrum-one";

const ACTIVE = DEPLOYMENTS[NETWORK];

export const IS_TESTNET = NETWORK === "arbitrum-sepolia";

/** The chain the dApp talks to. */
export const DEX_CHAIN = ACTIVE.chain;

/**
 * RPC URL, context-aware so the provider key never reaches the browser:
 *   - Server-side (SSR): reads the private RPC_URL env var directly.
 *   - Browser: routes through the /api/rpc Next.js proxy.
 * Set RPC_URL (no NEXT_PUBLIC prefix) in .env.local.
 */
export function getRpcUrl(): string {
  if (typeof window === "undefined") {
    return serverRpcUrl();
  }
  return `${window.location.origin}/api/rpc`;
}

/** Upstream JSON-RPC for server code (the /api/rpc proxy and SSR reads). */
export const serverRpcUrl = (): string => process.env.RPC_URL || ACTIVE.defaultRpcUrl;

/** Upstream JSON-RPC for wide eth_getLogs sweeps (some providers cap the range). */
export const serverLogsRpcUrl = (): string => process.env.RPC_LOGS_URL || ACTIVE.defaultLogsRpcUrl;

/** Block explorer base for tx links. */
export const EXPLORER_URL = ACTIVE.explorerUrl;

/** PrigeeXV3Factory creation block on the active network. */
export const V3_START_BLOCK = ACTIVE.v3StartBlock;

// ── Contract addresses ───────────────────────────────────────────────────────
export const ADDRESSES = ACTIVE.addresses;

export const DEX_TOKEN_LIST = ACTIVE.tokens;
export const STABLECOINS = ACTIVE.stablecoins;
export const USD_ANCHOR = ACTIVE.usdAnchor;

// ── Subgraph endpoints ────────────────────────────────────────────────────────
// All subgraph queries go through the Next.js proxy routes so private Goldsky
// URLs and bearer tokens never reach the browser. Upstream URLs come from the
// server-only env vars (SUBGRAPH_URL_V3/V2/PROTOCOL + SUBGRAPH_BEARER_TOKEN),
// falling back to the active network's defaults.
export const SUBGRAPHS = {
  v3:       "/api/subgraph/v3",
  v2:       "/api/subgraph/v2",
  protocol: "/api/subgraph/protocol",
};

export type SubgraphKey = keyof typeof SUBGRAPHS;

/** Server-only: upstream URL for a subgraph on the active network. */
export function subgraphUpstream(graph: string): string | undefined {
  switch (graph) {
    case "v3":
      return process.env.SUBGRAPH_URL_V3 || ACTIVE.defaultSubgraphs.v3;
    case "v2":
      return process.env.SUBGRAPH_URL_V2 || ACTIVE.defaultSubgraphs.v2;
    case "protocol":
      return process.env.SUBGRAPH_URL_PROTOCOL || ACTIVE.defaultSubgraphs.protocol;
    default:
      return undefined;
  }
}

export type DexAddressKey = keyof typeof ADDRESSES;
