"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CaretDown, FilePdf, X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";

// Module-level cache so multiple mounts skip the API call within the same session
let _guidelinesCache: Guideline[] | null = null;
let _cacheExpiresAt = 0;

interface Guideline {
  id: string;
  label: string;
  description: string | null;
  fileName: string;
  isPlatform: boolean;
}

interface Props {
  selectedId: string | null;
  onChange: (id: string | null) => void;
}

export function GuidelineSelector({ selectedId, onChange }: Props) {
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [open, setOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      setLoggedIn(true);
      const now = Date.now();
      if (_guidelinesCache && now < _cacheExpiresAt) {
        setGuidelines(_guidelinesCache);
        return;
      }
      fetch("/api/guidelines")
        .then((r) => r.ok ? r.json() : Promise.resolve({ guidelines: [] }))
        .then((d) => {
          const list = d.guidelines ?? [];
          _guidelinesCache = list;
          _cacheExpiresAt = Date.now() + 30_000; // 30s
          setGuidelines(list);
        })
        .catch(() => {});
    });
  }, []);

  if (!loggedIn) return null;

  const selected = guidelines.find((g) => g.id === selectedId);

  return (
    <div className="flex flex-col gap-1.5 relative">
      <p className="font-mono text-[10px] text-[var(--color-text-tertiary)] tracking-widest">BRAND_GUIDELINES // LIBRARY</p>

      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2.5 text-left hover:border-[var(--color-border-bright)] transition-colors"
      >
        {selected ? (
          <>
            <FilePdf size={12} weight="thin" className="text-[var(--color-accent)] shrink-0" />
            <span className="font-mono text-xs text-[var(--color-text-primary)] flex-1 truncate">{selected.label}</span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); onChange(null); } }}
              className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] shrink-0 cursor-pointer"
            >
              <X size={11} />
            </span>
          </>
        ) : (
          <>
            <span className="font-mono text-xs text-[var(--color-text-tertiary)] flex-1">Select a guideline...</span>
            <CaretDown size={11} className={cn("text-[var(--color-text-tertiary)] transition-transform", open && "rotate-180")} />
          </>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 z-20 border border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-lg max-h-52 overflow-y-auto mt-1">
            {guidelines.length === 0 ? (
              <p className="font-mono text-[10px] text-[var(--color-text-tertiary)] px-3 py-3">No guidelines uploaded yet.</p>
            ) : (
              guidelines.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => { onChange(g.id); setOpen(false); }}
                  className={cn(
                    "w-full flex items-start gap-2 px-3 py-2.5 text-left border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface)] transition-colors",
                    g.id === selectedId && "bg-[var(--color-accent-dim)]"
                  )}
                >
                  <FilePdf size={12} weight="thin" className={cn("shrink-0 mt-0.5", g.isPlatform ? "text-[var(--color-accent)]" : "text-[var(--color-text-tertiary)]")} />
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-[var(--color-text-primary)] truncate">{g.label}</p>
                    {g.isPlatform && <p className="font-mono text-[9px] text-[var(--color-accent)]">PLATFORM</p>}
                  </div>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
