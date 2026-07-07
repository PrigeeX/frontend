"use client";

// Light/dark toggle (FE-36). Persists to localStorage and flips the
// data-theme on <html>, which remaps the neutral tokens in globals.css.

import React, { useSyncExternalStore } from "react";
import { Icon } from "./icons";

type Theme = "dark" | "light";

// The data-theme attribute on <html> is the source of truth: the no-flash
// script in layout.tsx applies the saved theme there before hydration, so the
// server snapshot ("dark") is corrected without a synchronous setState.
const subscribe = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
};
const getTheme = (): Theme =>
  document.documentElement.dataset.theme === "light" ? "light" : "dark";
const getServerTheme = (): Theme => "dark";

export const ThemeToggle = () => {
  const theme = useSyncExternalStore(subscribe, getTheme, getServerTheme);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    localStorage.setItem("prigeex-theme", next);
    if (next === "light") document.documentElement.dataset.theme = "light";
    else delete document.documentElement.dataset.theme;
  };

  return (
    <button
      className="nav-theme-toggle"
      onClick={toggle}
      title={theme === "dark" ? "Switch to light" : "Switch to dark"}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Icon.Sun size={15} /> : <Icon.Moon size={15} />}
    </button>
  );
};
