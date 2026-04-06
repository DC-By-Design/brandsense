"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft } from "@phosphor-icons/react";

function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") ?? "/";
  const error = params.get("error");

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(error ? "Authentication failed. Try again." : null);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace(redirect);
    });
  }, []);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setErr(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirect)}`,
      },
    });
    setLoading(false);
    if (error) { setErr(error.message); return; }
    setSent(true);
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col gap-8">

        <div className="flex flex-col gap-2">
          <p className="font-mono text-[10px] text-[var(--color-text-tertiary)] tracking-widest">&gt; SIGN_IN</p>
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
            Save your work.
          </h1>
          <p className="font-mono text-xs text-[var(--color-text-secondary)] leading-relaxed">
            Account unlocks brand guideline library and saved review history. Analysis works without an account.
          </p>
        </div>

        {sent ? (
          <div className="border border-[var(--color-accent)] bg-[var(--color-accent-dim)] px-4 py-4 flex flex-col gap-2">
            <p className="font-mono text-xs text-[var(--color-accent)] tracking-widest">LINK_SENT //</p>
            <p className="font-mono text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Check <span className="text-[var(--color-text-primary)]">{email}</span> — click the link to sign in. You can close this tab.
            </p>
          </div>
        ) : (
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)]">
            <form onSubmit={handleMagicLink} className="p-4 flex flex-col gap-3">
              <div className={`flex items-center gap-2 border px-3 py-2.5 bg-[var(--color-surface-raised)] transition-all focus-within:border-[var(--color-accent)] ${err ? "border-[var(--color-high-risk)]" : "border-[var(--color-border)]"}`}>
                <span className="font-mono text-xs text-[var(--color-accent)] shrink-0">&gt;</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErr(null); }}
                  placeholder="you@example.com"
                  className="flex-1 bg-transparent font-mono text-xs outline-none placeholder:text-[var(--color-text-tertiary)] text-[var(--color-text-primary)]"
                  autoFocus
                />
              </div>
              {err && <p className="font-mono text-[10px] text-[var(--color-high-risk)]">{err}</p>}
              <button
                type="submit"
                disabled={!email.trim() || loading}
                className="w-full py-2.5 font-mono text-xs tracking-widest bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-bright)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={email.trim() ? { boxShadow: "0 0 20px rgba(232,101,10,0.25)" } : {}}
              >
                {loading ? "SENDING..." : "> SEND_MAGIC_LINK"}
              </button>
            </form>
          </div>
        )}

        <button
          onClick={() => router.push("/")}
          className="font-mono text-[10px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors text-center"
        >
          Continue without account →
        </button>
      </div>
    </div>
  );
}

export default function AuthPage() {
  const router = useRouter();

  return (
    <main className="min-h-dvh flex flex-col bg-[var(--color-bg)] scanlines">
      <header className="border-b border-[var(--color-border)] px-6 py-3 flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 font-mono text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <ArrowLeft size={11} />
          BACK
        </button>
        <span className="font-mono text-xs tracking-widest text-[var(--color-chrome)]">BRAND_SENSE</span>
        <span className="font-mono text-xs text-[var(--color-text-tertiary)]">SIGN_IN / SIGN_UP</span>
      </header>

      <Suspense fallback={<div className="flex-1" />}>
        <AuthForm />
      </Suspense>
    </main>
  );
}

