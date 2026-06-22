import { createAppKit } from "@reown/appkit/react";
import { arbitrum, arbitrumSepolia } from "@reown/appkit/networks";
import { wagmiAdapter, WC_PROJECT_ID } from "./wagmi";

const metadata = {
  name: "PrigeeX",
  description: "PrigeeX - on-chain trading and staking.",
  url:
    typeof window !== "undefined"
      ? window.location.origin
      : "https://prigeex.app",
  icons: ["https://prigeex.app/icon.png"],
};

export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks: [arbitrumSepolia, arbitrum],
  defaultNetwork: arbitrumSepolia,
  projectId: WC_PROJECT_ID,
  metadata,
  features: {
    analytics: false,
    email: false,
    socials: false,
    onramp: false,
    swaps: false,
  },
  themeMode: "dark",
  themeVariables: {
    "--w3m-font-family": '"Geist", ui-sans-serif, system-ui, sans-serif',
    "--w3m-accent": "#e8c089",
    "--w3m-color-mix": "#06070a",
    "--w3m-color-mix-strength": 24,
    "--w3m-border-radius-master": "2px",
  },
});
