// Typed accessor over packages/dex-config. Components and adapters import the
// addresses from here as `0x${string}` so viem/wagmi calls stay type-safe, and
// use the gate helpers to degrade gracefully when a feature is not deployed
// (NFR-09) - e.g. analytics falls back to "warming up" when a subgraph is unset.

import { ADDRESSES, SUBGRAPHS, DEX_CHAIN, RPC_URL, EXPLORER_URL } from "@/packages/dex-config";

type Hex = `0x${string}`;

/** All on-chain addresses, narrowed to the hex literal type viem expects. */
export const DEX = ADDRESSES as { [K in keyof typeof ADDRESSES]: Hex };

export { SUBGRAPHS, DEX_CHAIN, RPC_URL, EXPLORER_URL };

const ZERO = "0x0000000000000000000000000000000000000000";

const isSet = (a?: string): a is Hex =>
  Boolean(a) && /^0x[0-9a-fA-F]{40}$/.test(a!) && a !== ZERO;

/** True when the V3 AMM is deployed - gates the liquidity + swap features. */
export const dexConfigured = (): boolean =>
  isSet(DEX.v3Factory) && isSet(DEX.positionManager) && isSet(DEX.swapRouter);

/** True when a given subgraph endpoint is set - gates analytics/enrichment. */
export const subgraphConfigured = (url?: string): boolean =>
  Boolean(url && url.startsWith("http"));

/** Explorer link for a tx hash (FE-14). */
export const txUrl = (hash: string) => `${EXPLORER_URL}/tx/${hash}`;
export const addressUrl = (addr: string) => `${EXPLORER_URL}/address/${addr}`;
