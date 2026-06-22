"use client";

// Light/dark toggle (FE-36). Persists to localStorage and flips the
// data-theme on <html>, which remaps the neutral tokens in globals.css.

import React, { useState } from "react";
import { Icon } from "./icons";

type Theme = "dark" | "light";

// Initialised from the data-theme the no-flash script in layout.tsx already set,
// so there is no effect-driven setState (and no flash).
const initialTheme = (): Theme =>
  typeof document !== "undefined" && document.documentElement.dataset.theme === "light" ? "light" : "dark";

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
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
