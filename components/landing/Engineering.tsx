import React from "react";
import { Reveal } from "./Reveal";

const PILLARS = [
  {
    idx: "01",
    title: "Institutional grade by design.",
    body: "Deterministic execution and verified contracts, built on industry-standard security patterns.",
  },
  {
    idx: "02",
    title: "Precision execution.",
    body: "Every route carries slippage and deadline guards. No stale quotes, no silent failures.",
  },
  {
    idx: "03",
    title: "Fees flow back to stakers.",
    body: "Protocol fees route to PGX stakers, proportional, claimable, and transparent on-chain.",
  },
  {
    idx: "04",
    title: "Audit-ready and publicly verified.",
    body: "Built to an audit-ready standard, with every contract verified on the block explorer.",
  },
  {
    idx: "05",
    title: "Built for settlement at scale.",
    body: "Infrastructure ready for treasury operations and the capital markets moving on-chain.",
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
        <div className="sec-num">Engineering</div>
        <h2 className="sec-title">
          Built to earn
          <br />
          <em>serious capital.</em>
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
