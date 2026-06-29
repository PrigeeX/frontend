import React from "react";
import { Reveal } from "./Reveal";

export const Manifest = () => (
  <section className="manifest" id="mission">
    <div className="container" style={{ position: "relative" }}>
      <Reveal as="div" className="sec-head">
        <div className="sec-num">Manifest</div>
        <h2 className="sec-title">
          Capital is coming on-chain.
          <br />
          It expects <em>a venue.</em>
        </h2>
      </Reveal>

      <Reveal as="div" className="manifest__body">
        <div className="label">Position</div>
        <div>
          <p>
            For most of crypto, liquidity has lived in casinos. Loud interfaces, hidden mechanics, yield with no provenance.
          </p>
          <p>
            PrigeeX is built for the next visitor: the treasury desk, the family office, the allocator routing institutional capital on-chain. They do not need novelty. They need a <em>venue.</em> Audited execution, transparent revenue, and a control surface that respects how serious money operates.
          </p>
          <p>PrigeeX is that venue.</p>
        </div>
      </Reveal>

      <Reveal as="div" className="manifest__sig">
        <div>Filed</div>
        <div>PRIGEEX · 2026 · ARBITRUM</div>
      </Reveal>
    </div>
  </section>
);
