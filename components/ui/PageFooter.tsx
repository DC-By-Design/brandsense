"use client";

import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function PageFooter() {
  return (
    <footer className="shrink-0 border-t border-[var(--color-border)] px-6 py-3">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <p className="font-mono text-[10px] text-[var(--color-text-tertiary)]">FOSTER_STUDIO_PROJECT</p>
        <ThemeToggle inline />
        <p className="font-mono text-[10px] text-[var(--color-text-tertiary)]">BRAND_SENSE</p>
      </div>
    </footer>
  );
}
