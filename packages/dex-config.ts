// =============================================================================
// PrigeeX DEX config - single source of truth for every on-chain address and
// subgraph endpoint. Kept here (not in .env) so the whole deployment is
// version-controlled and readable in one place.
//
// The chain is Arbitrum Sepolia (id 421614). For full-stack local dev we run an
// Anvil *fork* of Arbitrum Sepolia at http://localhost:8545 - same chain id,
// just a different RPC - with the contracts below deployed onto it. Promoting to
// public Sepolia / mainnet later is a one-file edit: swap the addresses and
// point RPC_URL at the public endpoint.
// =============================================================================

import { arbitrumSepolia } from "wagmi/chains";

/** The chain the dApp talks to. Local Anvil keeps Arbitrum Sepolia's id. */
export const DEX_CHAIN = arbitrumSepolia;

/**
 * RPC the wallet/reads use. Defaults to the local Anvil fork; override with
 * NEXT_PUBLIC_RPC_URL to point at a public Arbitrum Sepolia node.
 */
export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL || "http://localhost:8545";

/** Block explorer base for tx links (FE-14). */
export const EXPLORER_URL = "https://sepolia.arbiscan.io";

// ── Contract addresses (from ../anvil_deployments.txt) ───────────────────────
export const ADDRESSES = {
  // Core token + staking
  PGX: "0xe5617b9664db9c259AaDE0a7E2bc74D6c90AC2f4",
  staking: "0xf78919fBB99DAf6c84e91Fa71A34B233A377FC56",
  feeDistributor: "0x44b23B3C7EaA8B75a5F2Bc25D42DdffE42923036",
  twapOracle: "0x9993FE6ae8e5B0E3648C4723498480dD77211d15",

  // V3 AMM (concentrated liquidity + swap)
  v3Factory: "0x84C9D4838b8d1c0771C1d6a49122f8D869447B48",
  positionManager: "0x12C23B3F6CAD664d8E81EB9C0220e58fe235a6C1",
  swapRouter: "0x5d073c893b9F7b6C59A6Cc87bCE4154dcB1477C3",
  quoterV2: "0xa3386E66bF2F763102797295Ebe668c758D8F402",
  tickLens: "0x3Ea7e0212Dd5cD087C0c75Be3e0F5F9444aCC229",
  multicall: "0xfe7c43C098D7b7A60beF94be9745Eb3D4B686e9d",
  weth9: "0x980B62Da83eFf3D4576C647993b0c1D7faf17c73",

  // V2 AMM (legacy pairs / router)
  v2Factory: "0xaDC6EB98Fca8050bb886Ecd978F70F43B4BB5563",
  v2Router: "0x3518832Ef458F6EA24506215a39a82709806b76d",
} as const satisfies Record<string, `0x${string}`>;

// ── Subgraph endpoints (local graph-node) ────────────────────────────────────
// V3 = swap/pool/LP analytics, V2 = legacy pairs, Protocol = staking + fees.
export const SUBGRAPHS = {
  v3: "http://localhost:8000/subgraphs/name/prigeex-v3-arbitrum-sepolia",
  v2: "http://localhost:8000/subgraphs/name/prigeex-v2-arbitrum-sepolia",
  protocol: "http://localhost:8000/subgraphs/name/prigeex-protocol-subgraph",
} as const;

export type DexAddressKey = keyof typeof ADDRESSES;
