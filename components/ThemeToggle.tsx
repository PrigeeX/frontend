"use client";

// Light/dark toggle (FE-36). Persists to localStorage and flips the
// data-theme on <html>, which remaps the neutral tokens in globals.css.

import React, { useEffect, useState } from "react";
import { Icon } from "./icons";

type Theme = "dark" | "light";

export const ThemeToggle = () => {
  // The server always renders the dark icon; the saved theme (already applied to
  // <html> by the no-flash script in layout.tsx) is read after mount so the
  // hydrated tree matches the server markup.
  const [theme, setTheme] = useState<Theme>("dark");
  useEffect(() => {
    if (document.documentElement.dataset.theme === "light") setTheme("light");
  }, []);

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
