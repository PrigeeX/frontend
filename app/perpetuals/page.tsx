import { Nav } from "@/components/Nav";

export const metadata = {
  title: "Perpetuals, PrigeeX",
};

export default function Perpetuals() {
  return (
    <>
      <Nav />
      <main className="app-main">
        <div className="container-app">
          <div className="page-head">
            <div className="sec-num">07, Perpetuals</div>
            <h1>
              Perpetuals, <em>on approach.</em>
            </h1>
          </div>

          <div
            className="surface"
            style={{
              padding: 48,
              maxWidth: 760,
              display: "grid",
              gap: 18,
            }}
          >
            <div className="eyebrow" style={{ alignSelf: "flex-start" }}>
              <i className="pulse" />
              Horizon, Phase 3
            </div>
            <p style={{ fontFamily: "var(--f-display)", fontSize: 26, lineHeight: 1.32, color: "var(--ink)", margin: 0 }}>
              The full institutional surface includes perpetuals, aggregator routing, and gated pools for regulated capital. We are building it. This page is the placeholder while the runway is cleared.
            </p>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--ink-soft)", margin: 0, maxWidth: 56 + "ch" }}>
              When it is ready, the venue will open early access. Until then, the live surface lives at Swap, Staking, and Rewards.
            </p>
            <div className="row gap-10" style={{ marginTop: 8 }}>
              <a href="/swap" className="btn btn--warm">
                Visit Swap
                <svg viewBox="0 0 12 12" fill="none" aria-hidden style={{ width: 12, height: 12 }}>
                  <path d="M2 6h7M6 3l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              <a href="/" className="btn btn--ghost">
                Back to the manifest
              </a>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
