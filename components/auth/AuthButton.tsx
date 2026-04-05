"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

function getInitials(user: User): string {
  const meta = user.user_metadata ?? {};

  // Explicit first_name / last_name fields (e.g. custom signup form)
  const first = (meta.first_name as string | undefined)?.trim();
  const last = (meta.last_name as string | undefined)?.trim();
  if (first && last) return (first[0] + last[0]).toUpperCase();
  if (first) return first[0].toUpperCase();

  // Google OAuth / social providers use full_name or name
  const fullName = ((meta.full_name ?? meta.name) as string | undefined)?.trim();
  if (fullName) {
    const parts = fullName.split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  }

  // Magic link — derive from email local part: first.last@… → FL
  const local = (user.email ?? "").split("@")[0];
  const parts = local.split(/[._-]/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return (local[0] ?? "?").toUpperCase();
}

export function AuthButton() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  if (!user) {
    return (
      <button
        onClick={() => router.push("/auth")}
        className="font-mono text-[10px] text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] transition-colors tracking-widest"
      >
        SIGN_IN / SIGN_UP
      </button>
    );
  }

  const initials = getInitials(user);

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => router.push("/dashboard")}
        className="font-mono text-[10px] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors tracking-widest"
      >
        DASHBOARD
      </button>
      <div className="relative">
        <button
          onClick={() => setMenuOpen((p) => !p)}
          className="flex items-center gap-1.5 font-mono text-[10px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <span className="w-5 h-5 bg-[var(--color-accent)] text-white flex items-center justify-center font-mono text-[9px] font-bold">
            {initials}
          </span>
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-2 z-20 border border-[var(--color-border)] bg-[var(--color-surface-raised)] min-w-40 shadow-lg">
              <div className="px-4 py-2.5 border-b border-[var(--color-border)]">
                <p className="font-mono text-[9px] text-[var(--color-text-tertiary)] truncate">{user.email}</p>
              </div>
              <button
                onClick={signOut}
                className="w-full px-4 py-2.5 font-mono text-[10px] text-left text-[var(--color-text-tertiary)] hover:text-[var(--color-high-risk)] hover:bg-[var(--color-surface)] transition-colors tracking-widest"
              >
                SIGN_OUT
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
