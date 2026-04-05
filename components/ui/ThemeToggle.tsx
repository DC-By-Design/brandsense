"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "@phosphor-icons/react";

interface ThemeToggleProps {
  /** Render inline in a footer/bar rather than fixed-bottom-center */
  inline?: boolean;
}

export function ThemeToggle({ inline = false }: ThemeToggleProps) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved === "dark" || (!saved && prefersDark);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  if (!mounted) return inline ? <div className="w-16 h-5" /> : null;

  const button = (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex items-center gap-1.5 transition-all hover:opacity-80 active:scale-95"
    >
      <Sun
        size={11}
        weight={dark ? "regular" : "fill"}
        className={dark ? "text-[var(--color-text-tertiary)]" : "text-[var(--color-accent)]"}
      />
      <div className="w-6 h-3 rounded-full bg-[var(--color-border)] relative">
        <div
          className="absolute top-0.5 w-2 h-2 rounded-full bg-[var(--color-accent)] transition-all duration-300"
          style={{ left: dark ? "calc(100% - 10px)" : "2px" }}
        />
      </div>
      <Moon
        size={11}
        weight={dark ? "fill" : "regular"}
        className={dark ? "text-[var(--color-accent)]" : "text-[var(--color-text-tertiary)]"}
      />
    </button>
  );

  if (inline) return button;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      {button}
    </div>
  );
}
