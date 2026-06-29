import { http } from "wagmi";
import { arbitrum, arbitrumSepolia } from "wagmi/chains";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { getRpcUrl } from "./dex";

export const WC_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "prigeex-demo";

export const SUPPORTED_CHAINS = [arbitrumSepolia, arbitrum];

export const wagmiAdapter = new WagmiAdapter({
  projectId: WC_PROJECT_ID,
  networks: SUPPORTED_CHAINS,
  ssr: true,
  transports: {
    [arbitrumSepolia.id]: http(getRpcUrl()),
    [arbitrum.id]: http("https://arb1.arbitrum.io/rpc"),
  },
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
