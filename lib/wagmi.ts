import { http, fallback, createConfig } from "wagmi";
import { sepolia } from "wagmi/chains";
import { injected, metaMask, walletConnect, coinbaseWallet } from "wagmi/connectors";

const WC_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "prigeex-demo";

const sepoliaRpc = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";

export const wagmiConfig = createConfig({
  chains: [sepolia],
  ssr: true,
  connectors: [
    injected(),
    metaMask(),
    coinbaseWallet({ appName: "PrigeeX" }),
    walletConnect({ projectId: WC_PROJECT_ID, showQrModal: true }),
  ],
  transports: {
    [sepolia.id]: fallback([
      http(sepoliaRpc),
      http("https://ethereum-sepolia-rpc.publicnode.com"),
      http("https://rpc2.sepolia.org"),
      http("https://rpc.sepolia.org"),
    ]),
  },
});


declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
