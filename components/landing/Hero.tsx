"use client";

import React, { useEffect, useRef } from "react";

export const Hero = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const tryPlay = () => {
      const p = v.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };
    if (v.readyState >= 2) tryPlay();
    v.addEventListener("canplay", tryPlay, { once: true });
    v.addEventListener("loadeddata", tryPlay, { once: true });
    const kick = () => tryPlay();
    document.addEventListener("pointerdown", kick, { once: true });
    document.addEventListener("keydown", kick, { once: true });
    document.addEventListener("scroll", kick, { once: true, passive: true });
    return () => {
      document.removeEventListener("pointerdown", kick);
      document.removeEventListener("keydown", kick);
      document.removeEventListener("scroll", kick);
    };
  }, []);

  return (
    <section className="hero" id="top">
      <div className="hero__stage">
        <div className="hero__bg" aria-hidden>
          <video
            ref={videoRef}
            className="hero__video"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster=""
          >
            <source src="/assets/aviation.mp4" type="video/mp4" />
          </video>
          <div className="hero__shade" />
          <div className="hero__horizon" />
          <div className="hero__grain" />
        </div>

        <div className="hero__inner">
          <div className="eyebrow">
            <i className="pulse" />
            An institutional venue, boarding now
          </div>

          <h1 className="headline">
            Liquidity,
            <br />
            <em>at altitude.</em>
          </h1>

          <p className="hero__sub">
            PrigeeX is institutional-grade infrastructure for on-chain liquidity, settlement, and tokenised real-world assets. Engineered for the capital arriving on-chain.
          </p>

          <div className="cta-row">
            <a className="btn btn--primary" href="#boarding">
              Launch App
              <svg viewBox="0 0 12 12" fill="none" aria-hidden>
                <path d="M2 6h7M6 3l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <a className="btn btn--ghost" href="#mission">
              Read the manifest
            </a>
          </div>
        </div>

        <div className="hero__hint">
          <span>Scroll</span>
          <i />
        </div>
      </div>
    </section>
  );
};
