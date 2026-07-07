import React from "react";
import Link from "next/link";
import { DOCS } from "@/lib/docs";

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
          </ul>
        </div>
        <div className="foot__col">
          <h4>Resources</h4>
          <ul>
            <li>
              <a
                href={DOCS.root}
                {...(DOCS.root !== "#" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                Docs
              </a>
            </li>
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
