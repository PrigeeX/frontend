import Link from "next/link";
import { Nav } from "@/components/Nav";

export const metadata = {
  title: "Page not found, PrigeeX",
};

export default function NotFound() {
  return (
    <>
      <Nav />
      <main className="app-main">
        <div className="container-app">
          <div className="page-head">
            <div className="sec-num">404</div>
            <h1>
              Off the <em>flight plan.</em>
            </h1>
          </div>

          <div
            className="surface"
            style={{ padding: "clamp(24px, 6vw, 48px)", maxWidth: 760, display: "grid", gap: 18 }}
          >
            <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--ink-soft)", margin: 0, maxWidth: "56ch" }}>
              This page does not exist. The live surface is at Swap, Liquidity, Portfolio, Staking and Analytics.
            </p>
            <div className="row gap-10" style={{ flexWrap: "wrap" }}>
              <Link href="/swap" className="btn btn--warm">
                Go to Swap
              </Link>
              <Link href="/pool" className="btn btn--ghost">
                Liquidity
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
