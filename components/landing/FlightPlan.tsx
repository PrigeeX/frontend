import React from "react";
import { Reveal } from "./Reveal";

type Phase = {
  cls: "phase--now" | "phase--next" | "phase--horizon";
  tag: string;
  sub: string;
  name: string;
  italic: string;
  copy: string;
};

const PHASES: Phase[] = [
  {
    cls: "phase--now",
    tag: "Now",
    sub: "Live",
    name: "",
    italic: "Foundation.",
    copy: "The core exchange is live on Arbitrum testnet: swaps, concentrated liquidity, and PGX staking backed by protocol fees, with mainnet ahead.",
  },
  {
    cls: "phase--next",
    tag: "Next",
    sub: "Scale",
    name: "",
    italic: "Expansion.",
    copy: "Deeper liquidity, perpetuals, and multi-chain deployment, bringing the venue to every major pool of on-chain capital.",
  },
  {
    cls: "phase--horizon",
    tag: "Horizon",
    sub: "Vision",
    name: "",
    italic: "The full stack.",
    copy: "Tokenised real-world assets, treasury-grade settlement, and institutional market infrastructure: a complete capital-markets layer, on-chain.",
  },
];

export const FlightPlan = () => (
  <section className="section-dark flightplan" id="flight-plan">
    <div className="section-dark__grid" aria-hidden />
    <div className="container">
      <Reveal as="div" className="sec-head">
        <div className="sec-num">Roadmap</div>
        <h2 className="sec-title">
          From working product
          <br />
          to <em>market standard.</em>
        </h2>
      </Reveal>

      <Reveal as="div" className="phases">
        {PHASES.map((p) => (
          <article key={p.tag} className={`phase ${p.cls}`}>
            <div className="phase__head">
              <span className="phase__tag">
                <i />
                {p.tag}
              </span>
              <span>{p.sub}</span>
            </div>
            <div className="phase__name">
              <em>{p.italic}</em>
            </div>
            <p className="phase__sub">{p.copy}</p>
          </article>
        ))}
      </Reveal>
    </div>
  </section>
);
