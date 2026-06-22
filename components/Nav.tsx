"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppKit, useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { shortAddr } from "@/lib/format";
import { ThemeToggle } from "./ThemeToggle";

type NavLink = { href: string; label: string; soon?: boolean };

const LINKS: NavLink[] = [
  { href: "/swap", label: "Swap" },
  { href: "/pool", label: "Liquidity" },
  { href: "/stake", label: "Staking" },
  { href: "/analytics", label: "Analytics" },
  { href: "/rewards", label: "Rewards" },
  { href: "/perpetuals", label: "Perpetuals", soon: true },
];

const DAPP_PATHS = ["/swap", "/pool", "/stake", "/analytics", "/rewards", "/perpetuals"];

const WalletButton = () => {
  const { open } = useAppKit();
  const { isConnected, address } = useAppKitAccount();
  const { caipNetwork } = useAppKitNetwork();

  if (isConnected && address) {
    return (
      <button
        className="nav-wallet nav-wallet--connected"
        onClick={() => open({ view: "Account" })}
        title="Manage wallet"
      >
        <span className="nav-wallet__dot" />
        {caipNetwork?.name && (
          <span className="nav-wallet__chain">{caipNetwork.name}</span>
        )}
        <span className="nav-wallet__addr">{shortAddr(address)}</span>
      </button>
    );
  }

  return (
    <button className="nav-wallet" onClick={() => open({ view: "Connect" })}>
      Connect wallet
    </button>
  );
};

export const Nav = () => {
  const pathname = usePathname();
  const isDapp = DAPP_PATHS.some((p) => pathname?.startsWith(p));

  return (
    <div className={`navwrap${isDapp ? " is-dapp" : ""}`}>
      <nav className="nav-pill" aria-label="Primary">
        <Link className="brand" href="/">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 2 L22 18 L12 14 L2 18 Z" fill="currentColor" />
            <path d="M12 14 L12 22" stroke="currentColor" strokeWidth="1.4" />
          </svg>
          <span>PrigeeX</span>
        </Link>

        <div className="nav-links">
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
        </div>

        {isDapp ? (
          <div className="row gap-8 nav-actions">
            <ThemeToggle />
            <WalletButton />
          </div>
        ) : (
          <Link className="cta" href="/swap">
            Launch App
            <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M2 6h7M6 3l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        )}
      </nav>
    </div>
  );
};
