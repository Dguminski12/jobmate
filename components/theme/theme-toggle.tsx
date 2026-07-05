"use client";

import { useState } from "react";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = window.localStorage.getItem("jobmate-theme");
  if (stored === "dark" || stored === "light") {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    window.localStorage.setItem("jobmate-theme", next);
  }

  const label = theme === "dark" ? "Light mode" : "Dark mode";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="rounded-full border border-slate-300 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:border-slate-400 hover:text-slate-950"
      aria-label={label}
      title={label}
    >
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}
