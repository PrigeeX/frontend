import React from "react";
import Link from "next/link";

export const Footer = () => (
  <footer className="foot">
    <div className="foot__inner">
      <div className="foot__grid">
        <div className="foot__brand">
          <div className="mark">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="foot-logo" src="/brand/logo-horizontal.svg" alt="PrigeeX" />
          </div>
          <p>An institutional venue for on-chain markets. Engineered on Arbitrum.</p>
        </div>
        <div className="foot__col">
          <h4>Protocol</h4>
          <ul>
            <li><Link href="/swap">Swap</Link></li>
            <li><Link href="/pool">Liquidity</Link></li>
            <li><Link href="/stake">Staking</Link></li>
            <li><Link href="/perpetuals">Perpetuals</Link></li>
          </ul>
        </div>
        <div className="foot__col">
          <h4>Resources</h4>
          <ul>
            <li><a href="#">Documentation</a></li>
            <li><a href="#">Contracts</a></li>
            <li><a href="#">Audit reports</a></li>
            <li><a href="#">Subgraph</a></li>
          </ul>
        </div>
        <div className="foot__col">
          <h4>Channels</h4>
          <ul>
            <li><a href="#">GitHub</a></li>
            <li><a href="#">X</a></li>
            <li><a href="#">Discord</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </div>
      </div>
      <div className="foot__bottom">
        <div className="L">
          <span>PRIGEEX</span>
          <span className="sep">·</span>
          <span>© 2026</span>
        </div>
        <div className="R">
          <span>ARBITRUM</span>
        </div>
      </div>
    </div>
  </footer>
);
