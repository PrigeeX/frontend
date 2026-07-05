import React from "react";
import Link from "next/link";
import { Reveal } from "./Reveal";

export const Boarding = () => (
  <section className="boarding" id="boarding">
    <div className="boarding__grid" aria-hidden />
    <div className="container">
      <Reveal as="h2">
        The venue is live.
        <br />
        <em>Be early.</em>
      </Reveal>
      <Reveal as="p">
        PrigeeX is live on Arbitrum testnet, with mainnet ahead. Connect a wallet, route a trade, provide liquidity, or stake PGX to share in protocol revenue from day one.
      </Reveal>
      <Reveal as="div" className="cta-row">
        <Link className="btn btn--warm" href="/swap">
          Launch App
          <svg viewBox="0 0 12 12" fill="none" aria-hidden>
            <path d="M2 6h7M6 3l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <a className="btn btn--ghost" href="#mission">
          Read documentation
        </a>
      </Reveal>
    </div>
  </section>
);
