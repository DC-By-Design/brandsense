"use client";

import { useEffect, useState } from "react";
import { Warning } from "@phosphor-icons/react";

export function KeyStatus() {
  const [status, setStatus] = useState<"loading" | "ok" | "missing">("loading");

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((d: { configured: boolean }) => setStatus(d.configured ? "ok" : "missing"))
      .catch(() => setStatus("missing"));
  }, []);

  if (status === "loading") return null;

  if (status === "missing") {
    return (
      <div className="flex items-center gap-2 text-[var(--color-high-risk)]">
        <Warning size={12} weight="bold" />
        <span className="font-mono text-[10px]">
          NO_API_KEY — add GEMINI_API_KEY to .env.local
        </span>
      </div>
    );
  }

  return (
    <p className="font-mono text-[10px] text-[var(--color-text-tertiary)]">GEMINI_2.5_FLASH // LIVE</p>
  );
}
