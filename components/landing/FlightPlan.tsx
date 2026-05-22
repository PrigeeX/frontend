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
    sub: "Ascent",
    name: "",
    italic: "Ascent.",
    copy: "The MVP is live. Trade, provide liquidity, stake, and watch the venue work.",
  },
  {
    cls: "phase--next",
    tag: "Next",
    sub: "Cruise",
    name: "",
    italic: "Cruise.",
    copy: "Distribution and depth. We open the venue to a wider operator base and extend across chains.",
  },
  {
    cls: "phase--horizon",
    tag: "Horizon",
    sub: "Apogee",
    name: "",
    italic: "Apogee.",
    copy: "The full institutional surface. Settlement, treasury infrastructure, tokenised real-world assets, and the broader aviation-fintech ecosystem the venue is built to host.",
  },
];

export const FlightPlan = () => (
  <section className="section-dark flightplan" id="flight-plan">
    <div className="section-dark__grid" aria-hidden />
    <div className="container">
      <Reveal as="div" className="sec-head">
        <div className="sec-num">02, Flight plan</div>
        <h2 className="sec-title">
          From wheels-up
          <br />
          to <em>apogee.</em>
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
