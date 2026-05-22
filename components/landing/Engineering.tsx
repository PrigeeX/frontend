import React from "react";
import { Reveal } from "./Reveal";

const PILLARS = [
  {
    idx: "01",
    title: "Institutional grade by design.",
    body: "Built from the ground up for capital that expects the discipline of a venue, not the volatility of a casino floor.",
  },
  {
    idx: "02",
    title: "Precision execution.",
    body: "Every route carries slippage and deadline guards. No stale fills, no surprise prints.",
  },
  {
    idx: "03",
    title: "Revenue flows back to stakers.",
    body: "Protocol revenue routes to PGX stakers, proportional, claimable, and transparent on-chain.",
  },
  {
    idx: "04",
    title: "Audited and publicly verified.",
    body: "Industry-standard security patterns throughout, with every contract verified on the block explorer.",
  },
  {
    idx: "05",
    title: "Built for settlement at scale.",
    body: "Infrastructure to host treasury operations, tokenised real-world assets, and the broader aviation-fintech ecosystem.",
  },
  {
    idx: "06",
    title: "Open analytics, no opaque metrics.",
    body: "Every flow is indexed in the open. Pull live state directly from the subgraph; nothing hidden behind a marketing dashboard.",
  },
];

export const Engineering = () => (
  <section className="section-dark engineering" id="engineering">
    <div className="section-dark__grid" aria-hidden />
    <div className="container">
      <Reveal as="div" className="sec-head">
        <div className="sec-num">03, Engineered for</div>
        <h2 className="sec-title">
          Built like
          <br />
          the <em>venue it is.</em>
        </h2>
      </Reveal>

      <Reveal as="div" className="pillars">
        {PILLARS.map((p) => (
          <div key={p.idx} className="pillar">
            <div className="pillar__idx">{p.idx}</div>
            <div className="pillar__title">{p.title}</div>
            <p className="pillar__body">{p.body}</p>
          </div>
        ))}
      </Reveal>
    </div>
  </section>
);
