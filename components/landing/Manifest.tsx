import React from "react";
import { Reveal } from "./Reveal";

export const Manifest = () => (
  <section className="manifest" id="mission">
    <div className="container" style={{ position: "relative" }}>
      <Reveal as="div" className="sec-head">
        <div className="sec-num">The thesis</div>
        <h2 className="sec-title">
          Capital is coming on-chain.
          <br />
          It expects <em>a venue.</em>
        </h2>
      </Reveal>

      <Reveal as="div" className="manifest__body">
        <div className="label">Thesis</div>
        <div>
          <p>
            Trillions in treasuries and funds are beginning their migration on-chain. The rails they settle on will define the next decade of financial markets.
          </p>
          <p>
            PrigeeX is building those rails: one venue for trading, liquidity, and staking, engineered on Arbitrum with verified contracts and protocol fees that route back to <em>the people who hold it.</em>
          </p>
        </div>
      </Reveal>
    </div>
  </section>
);
