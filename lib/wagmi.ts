import { http } from "wagmi";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { DEX_CHAIN, getRpcUrl } from "./dex";

export const WC_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "prigeex-demo";

// One network per deployment (see packages/dex-config.ts): Arbitrum One on
// app.prigeex.com, Arbitrum Sepolia on testnet.prigeex.com.
export const SUPPORTED_CHAINS = [DEX_CHAIN];

export const wagmiAdapter = new WagmiAdapter({
  projectId: WC_PROJECT_ID,
  networks: SUPPORTED_CHAINS,
  ssr: true,
  transports: {
    [DEX_CHAIN.id]: http(getRpcUrl()),
  },
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
