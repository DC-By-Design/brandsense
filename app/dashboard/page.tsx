"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Trash, UploadSimple, X, FilePdf, ArrowSquareOut } from "@phosphor-icons/react";
import { PageFooter } from "@/components/ui/PageFooter";
import { cn } from "@/lib/utils/cn";
import { scoreLabel, scoreColor, scoreDotColor } from "@/lib/utils/format";
import type { AnalysisResult } from "@/lib/schemas/analysis";
import type { BrandData } from "@/lib/analysis/brand-extract";

interface Guideline {
  id: string;
  label: string;
  description: string | null;
  fileName: string;
  fileSize: number;
  isPlatform: boolean;
  createdAt: string;
  brandData: BrandData | null;
}

interface Session {
  id: string;
  assetType: string;
  fileName: string | null;
  assetUrl: string | null;
  savedAt: string;
  guideline: { id: string; label: string } | null;
  result: AnalysisResult;
}

type Tab = "history" | "guidelines";

export default function DashboardPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("guidelines");
  const [userEmail, setUserEmail] = useState("");
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace("/auth"); return; }
      setUserEmail(data.user.email ?? "");
    });
  }, [supabase, router]);

  return (
    <main className="min-h-dvh flex flex-col bg-[var(--color-bg)] scanlines">
      <div className="fixed top-0 inset-x-0 z-30 header-strip">
        <div className="max-w-2xl mx-auto px-6 h-12 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 font-mono text-[10px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
            <ArrowLeft size={11} /> HOME
          </Link>
          <span className="font-mono text-xs tracking-widest text-[var(--color-chrome)]">BRAND_SENSE</span>
          <span className="font-mono text-[10px] text-[var(--color-text-tertiary)] truncate max-w-36">{userEmail}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 pt-16 pb-8 gap-6">
        <div className="flex flex-col gap-1">
          <p className="font-mono text-[10px] text-[var(--color-text-tertiary)] tracking-widest">&gt; DASHBOARD</p>
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Your workspace</h1>
        </div>

        <div className="glass-subtle rounded-xl flex gap-0 overflow-hidden p-1">
          {(["guidelines", "history"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 font-mono text-[10px] tracking-widest uppercase px-4 py-2 rounded-lg transition-all",
                tab === t
                  ? "bg-white/70 text-[var(--color-accent)] shadow-sm"
                  : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
              )}
            >
              {t === "guidelines" ? "BRAND_GUIDELINES" : "REVIEW_HISTORY"}
            </button>
          ))}
        </div>

        {tab === "guidelines" && <GuidelinesTab />}
        {tab === "history" && <HistoryTab />}
      </div>
      <PageFooter />
    </main>
  );
}

function GuidelinesTab() {
  const router = useRouter();
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const load = useCallback(() => {
    fetch("/api/guidelines")
      .then((r) => r.ok ? r.json() : Promise.resolve({ guidelines: [] }))
      .then((d) => { setGuidelines(d.guidelines ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  // Full-screen drag and drop
  useEffect(() => {
    const enter = (e: DragEvent) => {
      e.preventDefault();
      if (++dragCounter.current === 1) setIsDragging(true);
    };
    const leave = (e: DragEvent) => {
      e.preventDefault();
      if (--dragCounter.current === 0) setIsDragging(false);
    };
    const over = (e: DragEvent) => e.preventDefault();
    const drop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragging(false);
      const dropped = e.dataTransfer?.files[0];
      if (!dropped) return;
      if (dropped.type !== "application/pdf") { setErr("Only PDF files accepted"); return; }
      setFile(dropped);
      setLabel(dropped.name.replace(/\.pdf$/i, "").replace(/[-_]/g, " "));
      setShowForm(true);
    };
    document.addEventListener("dragenter", enter);
    document.addEventListener("dragleave", leave);
    document.addEventListener("dragover", over);
    document.addEventListener("drop", drop);
    return () => {
      document.removeEventListener("dragenter", enter);
      document.removeEventListener("dragleave", leave);
      document.removeEventListener("dragover", over);
      document.removeEventListener("drop", drop);
    };
  }, []);

  const handleUpload = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !label.trim()) return;
    setUploading(true);
    setErr(null);
    setUploadProgress("Uploading PDF...");
    const form = new FormData();
    form.append("file", file);
    form.append("label", label);
    if (description.trim()) form.append("description", description);

    setUploadProgress("Parsing brand guidelines with AI...");
    const res = await fetch("/api/guidelines", { method: "POST", body: form });
    setUploading(false);
    setUploadProgress(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as { error?: string };
      setErr(data.error ?? `ERR_${res.status}`);
      return;
    }
    setShowForm(false);
    setLabel(""); setDescription(""); setFile(null);
    load();
  }, [file, label, description]);

  async function handleDelete(id: string) {
    await fetch(`/api/guidelines/${id}`, { method: "DELETE" });
    setGuidelines((prev) => prev.filter((g) => g.id !== id));
  }

  const userGuidelines = useMemo(() => guidelines.filter(g => !g.isPlatform), [guidelines]);

  return (
    <>
      {/* Full-screen drag overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className="absolute inset-0 bg-[var(--color-bg)] opacity-96" />
          <div className="absolute inset-6 border border-dashed border-[var(--color-accent)]"
            style={{ boxShadow: "0 0 60px rgba(232,101,10,0.08) inset" }} />
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="w-14 h-14 border border-[var(--color-accent)] flex items-center justify-center"
              style={{ boxShadow: "0 0 24px rgba(232,101,10,0.3)" }}>
              <FilePdf size={22} weight="thin" className="text-[var(--color-accent)]" />
            </div>
            <p className="font-mono text-xs tracking-widest text-[var(--color-accent)]">DROP_BRAND_GUIDELINE_PDF</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">

        {/* Platform guideline */}
        <div className="glass-subtle rounded-xl px-4 py-3 flex items-start gap-3">
          <div className="w-1.5 h-1.5 bg-[var(--color-accent)] shrink-0 mt-1.5" />
          <div>
            <p className="font-mono text-[10px] text-[var(--color-accent)] tracking-widest">BRAND_SENSE // PLATFORM_GUIDELINES</p>
            <p className="font-mono text-[10px] text-[var(--color-text-secondary)] mt-1 leading-relaxed">
              Approved fonts, colours, logo usage, tone of voice, and photography standards.
            </p>
            <button onClick={() => window.open("/brand", "_blank")} className="font-mono text-[10px] text-[var(--color-accent)] hover:underline mt-1.5 block">
              VIEW_GUIDELINES →
            </button>
          </div>
        </div>

        {/* User guidelines */}
        {loading ? null : userGuidelines.length > 0 && (
          <div className="flex flex-col gap-2">
            {userGuidelines.map((g) => (
              <div key={g.id} className="glass-subtle rounded-xl overflow-hidden">
                {/* Header row */}
                <div className="flex items-start gap-3 px-4 py-3">
                  <FilePdf size={14} weight="thin" className="text-[var(--color-text-tertiary)] shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-[var(--color-text-primary)]">{g.label}</p>
                    {g.description && <p className="font-mono text-[10px] text-[var(--color-text-secondary)] mt-0.5">{g.description}</p>}
                    <p className="font-mono text-[10px] text-[var(--color-text-tertiary)] mt-0.5">
                      {g.fileName} // {(g.fileSize / 1024).toFixed(0)}KB
                      {g.brandData ? " // AI_PARSED" : " // PARSING_UNAVAILABLE"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => router.push(`/dashboard/guidelines/${g.id}`)}
                      className="flex items-center gap-1 font-mono text-[10px] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
                    >
                      <ArrowSquareOut size={11} />
                      VIEW
                    </button>
                    <button onClick={() => handleDelete(g.id)} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-high-risk)] transition-colors">
                      <Trash size={13} weight="thin" />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* Upload form */}
        {showForm ? (
          <form onSubmit={handleUpload} className="glass rounded-2xl p-4 flex flex-col gap-3 outline outline-1 outline-[var(--color-accent)]">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] text-[var(--color-accent)] tracking-widest">
                {uploading ? uploadProgress ?? "PROCESSING..." : "NEW_GUIDELINE"}
              </p>
              {!uploading && (
                <button type="button" onClick={() => { setShowForm(false); setFile(null); setLabel(""); }} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]">
                  <X size={13} />
                </button>
              )}
            </div>

            {file && (
              <div className="flex items-center gap-2 border border-[var(--color-border)] px-3 py-2 bg-[var(--color-surface-raised)]">
                <FilePdf size={13} weight="thin" className="text-[var(--color-accent)]" />
                <span className="font-mono text-xs text-[var(--color-text-primary)] flex-1 truncate">{file.name}</span>
                {!uploading && (
                  <button type="button" onClick={() => setFile(null)} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]">
                    <X size={11} />
                  </button>
                )}
              </div>
            )}

            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Label (e.g. Nike Brand Guidelines 2024)"
              disabled={uploading}
              className="border border-[var(--color-border)] bg-[var(--color-surface-raised)] focus:border-[var(--color-accent)] outline-none px-3 py-2.5 font-mono text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] transition-colors disabled:opacity-50"
            />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              disabled={uploading}
              className="border border-[var(--color-border)] bg-[var(--color-surface-raised)] focus:border-[var(--color-accent)] outline-none px-3 py-2.5 font-mono text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] transition-colors disabled:opacity-50"
            />

            {!file && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="border border-dashed border-[var(--color-border)] hover:border-[var(--color-accent)] py-4 flex items-center justify-center gap-2 font-mono text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <UploadSimple size={14} weight="thin" />
                SELECT_PDF
              </button>
            )}

            <input ref={fileRef} type="file" accept="application/pdf" onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setFile(f);
              if (!label) setLabel(f.name.replace(/\.pdf$/i, "").replace(/[-_]/g, " "));
            }} className="sr-only" />

            {err && <p className="font-mono text-[10px] text-[var(--color-high-risk)]">{err}</p>}

            {uploading ? (
              <div className="flex flex-col gap-2">
                <div className="h-px w-full bg-[var(--color-border)] relative overflow-hidden">
                  <div className="h-full bg-[var(--color-accent)] absolute left-0 top-0 animate-pulse" style={{ width: "60%" }} />
                </div>
                <p className="font-mono text-[10px] text-[var(--color-text-tertiary)]">{uploadProgress}</p>
              </div>
            ) : (
              <button
                type="submit"
                disabled={!file || !label.trim()}
                className="py-2.5 font-mono text-xs tracking-widest bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-bright)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ boxShadow: file && label.trim() ? "0 0 20px rgba(232,101,10,0.2)" : "none" }}
              >
                &gt; UPLOAD_AND_PARSE
              </button>
            )}
          </form>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="glass-subtle rounded-2xl border-dashed hover:outline hover:outline-1 hover:outline-[var(--color-accent)] py-4 font-mono text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] transition-all flex items-center justify-center gap-2"
          >
            <UploadSimple size={14} weight="thin" />
            DROP_PDF_ANYWHERE_OR_CLICK_TO_UPLOAD
          </button>
        )}
      </div>
    </>
  );
}

function HistoryTab() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then((d) => { setSessions(d.sessions ?? []); setLoading(false); });
  }, []);

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    setDeleting(id);
    await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    setSessions((prev) => prev.filter((s) => s.id !== id));
    setDeleting(null);
  }

  if (loading) return <LoadingRows />;

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="font-mono text-xs text-[var(--color-text-tertiary)]">NO_SAVED_REVIEWS</p>
        <p className="font-mono text-[10px] text-[var(--color-text-tertiary)]">Run a review and hit "Save" to see it here.</p>
        <button onClick={() => router.push("/")} className="font-mono text-[10px] text-[var(--color-accent)] hover:underline mt-2">
          &gt; NEW_REVIEW
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {sessions.map((s) => (
        <div key={s.id} className="glass-subtle rounded-xl overflow-hidden group">
          <button
            onClick={() => router.push(`/review/${s.id}`)}
            className="w-full px-4 py-3 flex items-start gap-4 text-left hover:bg-white/10 transition-colors"
          >
            <div className={cn("w-1.5 h-1.5 rounded-full shrink-0 mt-1.5", scoreDotColor(s.result.score))} />
            <div className="flex-1 min-w-0">
              <p className="font-mono text-xs text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-accent)] transition-colors">{s.fileName ?? s.assetUrl ?? "Asset"}</p>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className={cn("font-mono text-[10px]", scoreColor(s.result.score))}>{scoreLabel(s.result.score).toUpperCase()}</span>
                <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">{s.assetType.toUpperCase()}</span>
                {s.guideline && <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">// {s.guideline.label}</span>}
                <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">{new Date(s.savedAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="font-mono text-[10px] text-[var(--color-text-tertiary)] group-hover:text-[var(--color-accent)] transition-colors">VIEW →</span>
              <button
                onClick={(e) => handleDelete(e, s.id)}
                disabled={deleting === s.id}
                className="opacity-0 group-hover:opacity-100 text-[var(--color-text-tertiary)] hover:text-[var(--color-high-risk)] transition-all disabled:opacity-40"
                title="Delete review"
              >
                {deleting === s.id
                  ? <span className="font-mono text-[9px]">...</span>
                  : <Trash size={13} weight="thin" />}
              </button>
            </div>
          </button>
        </div>
      ))}
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="flex flex-col gap-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border border-[var(--color-border)] h-14 bg-[var(--color-surface)] animate-pulse" />
      ))}
    </div>
  );
}
