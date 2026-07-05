import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "PrigeeX, an institutional venue for on-chain markets.",
  description:
    "PrigeeX is institutional-grade infrastructure for on-chain liquidity, settlement, and tokenised real-world assets. Built for capital arriving on-chain.",
  keywords: [
    "PrigeeX", "PGX", "DEX", "institutional", "fintech",
    "liquidity", "settlement", "tokenisation", "RWA", "staking", "Arbitrum",
  ],
  icons: {
    icon: [
      { url: "/brand/prigeex-favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/brand/prigeex-mark-solid.svg",
  },
  openGraph: {
    title: "PrigeeX, an institutional venue for on-chain markets.",
    description:
      "Institutional-grade infrastructure for on-chain liquidity, settlement, and tokenised real-world assets.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#06070a",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: the no-flash script below mutates data-theme
    // before React hydrates, so the server/client attribute set can differ.
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/theme.css" />
        {/* Apply the saved theme before paint to avoid a flash (FE-36). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('prigeex-theme');if(t==='light')document.documentElement.dataset.theme='light';}catch(e){}`,
          }}
        />
      </head>
      <body>
        <Providers>
          <div className="app-shell">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
