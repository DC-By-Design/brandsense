"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft } from "@phosphor-icons/react";

export default function AuthPage() {
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

  async function handleGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirect)}`,
      },
    });
    if (error) {
      if (error.message.toLowerCase().includes("provider") || error.message.toLowerCase().includes("not enabled")) {
        setErr("Google sign-in isn't configured yet. Use magic link below.");
      } else {
        setErr(error.message);
      }
    }
  }

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
              {/* Google */}
              <div className="p-4 border-b border-[var(--color-border)]">
                <button
                  onClick={handleGoogle}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-[var(--color-border)] bg-[var(--color-surface-raised)] hover:border-[var(--color-border-bright)] transition-colors font-mono text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                >
                  <GoogleIcon />
                  CONTINUE_WITH_GOOGLE
                </button>
              </div>

              {/* Divider */}
              <div className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 h-px bg-[var(--color-border)]" />
                <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">OR</span>
                <div className="flex-1 h-px bg-[var(--color-border)]" />
              </div>

              {/* Magic link */}
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
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}
