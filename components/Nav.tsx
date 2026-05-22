"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = { href: string; label: string; soon?: boolean };

const LINKS: NavLink[] = [
  { href: "/stake", label: "Staking" },
  { href: "/swap", label: "Swap" },
  { href: "/rewards", label: "Rewards" },
  { href: "/perpetuals", label: "Perpetuals", soon: true },
];

export const Nav = () => {
  const pathname = usePathname();
  return (
    <div className="navwrap">
      <nav className="nav-pill" aria-label="Primary">
        <Link className="brand" href="/">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 2 L22 18 L12 14 L2 18 Z" fill="currentColor" />
            <path d="M12 14 L12 22" stroke="currentColor" strokeWidth="1.4" />
          </svg>
          <span>PrigeeX</span>
        </Link>
        {LINKS.map((l) =>
          l.soon ? (
            <span key={l.href} className="link is-soon" aria-disabled>
              {l.label}
              <span className="soon-tag">Soon</span>
            </span>
          ) : (
            <Link
              key={l.href}
              href={l.href}
              className="link"
              aria-current={pathname?.startsWith(l.href) ? "page" : undefined}
            >
              {l.label}
            </Link>
          ),
        )}
        <Link className="cta" href="/swap">
          Launch App
          <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2 6h7M6 3l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </nav>
    </div>
  );
};
