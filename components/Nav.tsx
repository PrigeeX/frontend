"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppKit, useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { shortAddr } from "@/lib/format";
import { ThemeToggle } from "./ThemeToggle";
import { Icon } from "./icons";

type NavLink = { href: string; label: string; soon?: boolean };

const LINKS: NavLink[] = [
  { href: "/swap", label: "Swap" },
  { href: "/pool", label: "Liquidity" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/stake", label: "Staking" },
  { href: "/analytics", label: "Analytics" },
  { href: "/perpetuals", label: "Perpetuals", soon: true },
];

const DAPP_PATHS = ["/swap", "/pool", "/portfolio", "/stake", "/analytics", "/perpetuals"];

const LINK_ICONS: Record<string, React.ReactNode> = {
  "/swap": <Icon.Swap size={16} />,
  "/pool": <Icon.Plus size={16} />,
  "/portfolio": <Icon.Wallet size={16} />,
  "/stake": <Icon.Lock size={16} />,
  "/analytics": <Icon.Chart size={16} />,
  "/perpetuals": <Icon.Chart size={16} />,
};

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
  const [menuOpen, setMenuOpen] = React.useState(false);

  // Route change means a link was chosen; fold the menu away. Adjusted during
  // render (not in an effect) so the closed menu paints with the new route.
  const [prevPath, setPrevPath] = React.useState(pathname);
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    setMenuOpen(false);
  }

  return (
    <>
      {/* Outside-click catcher. Lives outside .navwrap: its transform would
          re-anchor position: fixed descendants. */}
      {menuOpen && <div className="nav-menu-backdrop" onClick={() => setMenuOpen(false)} />}
      <div className={`navwrap${isDapp ? " is-dapp" : ""}`}>
        <nav className="nav-pill" aria-label="Primary">
          <Link className="brand" href="/" aria-label="PrigeeX home">
            {/* Dark-bg logo (light ink) for the landing nav + dApp dark mode;
                light-bg logo (dark ink) swaps in only on the light-themed dApp nav. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="brand-logo brand-logo--dark" src="/brand/logo-horizontal.svg" alt="PrigeeX" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="brand-logo brand-logo--light" src="/brand/logo-horizontal-light.svg" alt="" aria-hidden="true" />
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

          <button
            className="nav-menu-btn"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <Icon.Close size={16} /> : <Icon.Menu size={18} />}
          </button>
        </nav>

        {menuOpen && (
          <nav className="nav-menu" aria-label="Pages">
            {LINKS.map((l) =>
              l.soon ? (
                <span key={l.href} className="menu-link is-soon" aria-disabled>
                  <span className="menu-link__icon">{LINK_ICONS[l.href]}</span>
                  {l.label}
                  <span className="soon-tag">Soon</span>
                </span>
              ) : (
                <Link
                  key={l.href}
                  href={l.href}
                  className="menu-link"
                  aria-current={pathname?.startsWith(l.href) ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="menu-link__icon">{LINK_ICONS[l.href]}</span>
                  {l.label}
                </Link>
              ),
            )}
          </nav>
        )}
      </div>
    </>
  );
};
