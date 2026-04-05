"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadSimple, File, X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";
import { formatFileSize } from "@/lib/utils/format";
import { ACCEPTED_TYPES, MAX_FILE_SIZE_BYTES, detectAssetType } from "@/lib/schemas/upload";
import { useReviewStore } from "@/lib/store/review";
import { AuthButton } from "@/components/auth/AuthButton";
import { GuidelineSelector } from "@/components/guidelines/GuidelineSelector";
import { BackgroundRenderer } from "@/components/motion/BackgroundRenderer";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

type InputMode = "file" | "url";

export default function HomePage() {
  const router = useRouter();
  const { setInput, startUpload } = useReviewStore();
  const [isDragging, setIsDragging] = useState(false);
  const [glowing, setGlowing] = useState(false);

  const triggerGlow = () => {
    setGlowing(true);
    setTimeout(() => setGlowing(false), 2100);
  };
  const [mode, setMode] = useState<InputMode>("file");
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [brandGuideline, setBrandGuideline] = useState<File | null>(null);
  const [selectedGuidelineId, setSelectedGuidelineId] = useState<string | null>(null);
  const [context, setContext] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const brandInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > MAX_FILE_SIZE_BYTES) return `ERR: FILE_TOO_LARGE [${formatFileSize(file.size)} > 50MB]`;
    if (!(ACCEPTED_TYPES as readonly string[]).includes(file.type)) return "ERR: UNSUPPORTED_TYPE";
    return null;
  }, []);

  useEffect(() => {
    const enter = (e: DragEvent) => { e.preventDefault(); if (++dragCounter.current === 1) setIsDragging(true); };
    const leave = (e: DragEvent) => { e.preventDefault(); if (--dragCounter.current === 0) setIsDragging(false); };
    const over = (e: DragEvent) => e.preventDefault();
    const drop = (e: DragEvent) => {
      e.preventDefault(); dragCounter.current = 0; setIsDragging(false);
      const file = e.dataTransfer?.files[0];
      if (!file) return;
      const err = validateFile(file);
      if (err) { setFileError(err); return; }
      setFileError(null); setStagedFile(file); setMode("file"); triggerGlow();
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
  }, [validateFile]);

  const handleSubmit = useCallback(() => {
    const ctx = context.trim() || undefined;
    const gId = selectedGuidelineId ?? undefined;
    if (mode === "url") {
      try { new URL(url); } catch { setUrlError("ERR: INVALID_URL"); return; }
      setInput({ type: "url", url, brandGuideline: brandGuideline ?? undefined, guidelineId: gId, context: ctx });
    } else {
      if (!stagedFile) return;
      setInput({ type: "file", file: stagedFile, brandGuideline: brandGuideline ?? undefined, guidelineId: gId, context: ctx });
    }
    startUpload();
    router.push("/upload");
  }, [mode, url, stagedFile, brandGuideline, selectedGuidelineId, context, setInput, startUpload, router]);

  const canSubmit = mode === "file" ? !!stagedFile : !!url.trim();
  const assetType = stagedFile ? detectAssetType(stagedFile.type) : null;

  return (
    <>
      {isDragging && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className="absolute inset-0 bg-[var(--color-bg)] opacity-90" />
          <div className="absolute inset-6 border border-dashed border-[var(--color-accent)]"
            style={{ boxShadow: "0 0 60px rgba(232,101,10,0.08) inset" }} />
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="w-14 h-14 border border-[var(--color-accent)] flex items-center justify-center"
              style={{ boxShadow: "0 0 24px rgba(232,101,10,0.3)" }}>
              <UploadSimple size={22} weight="thin" className="text-[var(--color-accent)]" />
            </div>
            <p className="font-mono text-xs tracking-widest text-[var(--color-accent)] cursor">AWAITING_DROP</p>
          </div>
        </div>
      )}

      <BackgroundRenderer />

      {glowing && (
        <div
          className="fixed inset-0 z-40 pointer-events-none glow-pulse-ring"
          style={{
            boxShadow: "inset 0 0 0 2px rgba(232,101,10,0.6), inset 0 0 80px 8px rgba(232,101,10,0.15), 0 0 80px 8px rgba(232,101,10,0.1)",
          }}
        />
      )}

      <main className="h-dvh flex flex-col scanlines">
        {/* Inline header — not sticky */}
        <header className="w-full px-6 py-3 flex items-center justify-between gap-4 shrink-0 border-b border-[var(--color-border)]/60">
          <span className="font-mono text-xs tracking-widest text-[var(--color-chrome)] uppercase">BRAND_SENSE</span>
          <AuthButton />
        </header>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-4 py-6">
          <div className="w-full max-w-md flex flex-col gap-6">

            <div className="flex flex-col gap-2">
              <p className="font-mono text-xs text-[var(--color-text-tertiary)] tracking-widest">
                &gt; INITIALISING_BRAND_SENSE
              </p>
              <h1 className="text-2xl font-semibold leading-tight">
                <span className="chrome-text">Creative review.</span>
                <br />
                <span className="text-[var(--color-text-primary)]">Before you ship.</span>
              </h1>
            </div>

            {/* Panel */}
            <div className="glass-heavy rounded-2xl overflow-hidden">

              {/* Tabs */}
              <div className="border-b border-[var(--color-border)] flex">
                {(["file", "url"] as InputMode[]).map((m) => (
                  <button key={m} onClick={() => setMode(m)} className={cn(
                    "flex-1 py-2.5 font-mono text-xs tracking-widest uppercase transition-all",
                    mode === m
                      ? "text-[var(--color-accent)] bg-[var(--color-surface-raised)]/60"
                      : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
                  )}>
                    {mode === m && <span className="mr-1.5 text-[var(--color-accent)]">&gt;</span>}
                    {m === "file" ? "UPLOAD_FILE" : "PASTE_URL"}
                  </button>
                ))}
              </div>

              <div className="p-4 flex flex-col gap-3">
                {mode === "file" && (
                  <>
                    {!stagedFile ? (
                      <button onClick={() => fileInputRef.current?.click()} className={cn(
                        "w-full min-h-28 border border-dashed flex flex-col items-center justify-center gap-2 transition-all",
                        fileError
                          ? "border-[var(--color-high-risk)] text-[var(--color-high-risk)]"
                          : "border-[var(--color-border)] hover:border-[var(--color-accent)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                      )} style={{
                        background: "repeating-linear-gradient(-45deg,transparent,transparent 12px,rgba(255,255,255,0.012) 12px,rgba(255,255,255,0.012) 13px)"
                      }}>
                        <UploadSimple size={18} weight="thin" />
                        <div className="text-center">
                          <p className="font-mono text-xs tracking-widest uppercase">{fileError ?? "DROP_ASSET_HERE"}</p>
                          <p className="font-mono text-[10px] text-[var(--color-text-tertiary)] mt-0.5">JPG · PNG · WEBP · PDF · MP4 · MAX_50MB</p>
                        </div>
                      </button>
                    ) : (
                      <StagedFilePreview
                        file={stagedFile}
                        assetType={assetType}
                        onClear={() => { setStagedFile(null); setFileError(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      />
                    )}
                    <input ref={fileInputRef} type="file" accept={ACCEPTED_TYPES.join(",")}
                      onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const err = validateFile(f); if (err) { setFileError(err); return; } setFileError(null); setStagedFile(f); triggerGlow(); }}
                      className="sr-only" />
                  </>
                )}

                {mode === "url" && (
                  <div className="flex flex-col gap-1.5">
                    <div className={cn(
                      "flex items-center gap-2 border px-3 py-2.5 glass-subtle rounded-xl transition-all",
                      "focus-within:border-[var(--color-accent)]",
                      urlError ? "border-[var(--color-high-risk)]" : "border-transparent"
                    )}>
                      <span className="font-mono text-xs text-[var(--color-accent)] shrink-0">&gt;</span>
                      <input type="url" value={url}
                        onChange={(e) => { setUrl(e.target.value); setUrlError(null); }}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                        placeholder="https://"
                        className="flex-1 bg-transparent font-mono text-xs outline-none placeholder:text-[var(--color-text-tertiary)] text-[var(--color-text-primary)]"
                        autoFocus />
                    </div>
                    {urlError && <p className="font-mono text-[10px] text-[var(--color-high-risk)]">{urlError}</p>}
                  </div>
                )}

                <div className="border-t border-[var(--color-border)] pt-3 flex flex-col gap-2">
                  <GuidelineSelector selectedId={selectedGuidelineId} onChange={setSelectedGuidelineId} />
                  {!selectedGuidelineId && (
                    <>
                      <p className="font-mono text-[10px] text-[var(--color-text-tertiary)] tracking-widest">BRAND_GUIDELINES // ONE-OFF</p>
                      {!brandGuideline ? (
                        <button onClick={() => brandInputRef.current?.click()}
                          className="flex items-center gap-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors w-fit">
                          <span className="font-mono text-xs">+ ATTACH_PDF</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-[var(--color-text-secondary)] flex-1 truncate">{brandGuideline.name}</span>
                          <button onClick={() => { setBrandGuideline(null); if (brandInputRef.current) brandInputRef.current.value = ""; }}
                            className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors">
                            <X size={11} weight="thin" />
                          </button>
                        </div>
                      )}
                      <input ref={brandInputRef} type="file" accept="application/pdf"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f?.type === "application/pdf") setBrandGuideline(f); }}
                        className="sr-only" />
                    </>
                  )}
                </div>

                <div className="border-t border-[var(--color-border)] pt-3 flex flex-col gap-2">
                  <p className="font-mono text-[10px] text-[var(--color-text-tertiary)] tracking-widest">CONTEXT // OPTIONAL</p>
                  <textarea
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="Tell me what this is and who it's for…"
                    rows={2}
                    className="w-full glass-subtle rounded-xl focus:border-[var(--color-accent)] outline-none px-3 py-2 font-sans text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] resize-none leading-relaxed transition-colors"
                  />
                </div>

                <button onClick={handleSubmit} disabled={!canSubmit} className={cn(
                  "w-full py-2.5 font-mono text-xs tracking-widest uppercase transition-all",
                  canSubmit
                    ? "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-bright)] active:opacity-90"
                    : "border border-[var(--color-border)] text-[var(--color-text-tertiary)] cursor-not-allowed opacity-40"
                )} style={canSubmit ? { boxShadow: "0 0 24px rgba(232,101,10,0.3)" } : {}}>
                  &gt; RUN_BRAND_SENSE
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with theme toggle */}
        <footer className="shrink-0 px-6 py-3 flex items-center justify-between max-w-md mx-auto w-full">
          <p className="font-mono text-[10px] text-[var(--color-text-tertiary)]">DROP_FILE_ANYWHERE</p>
          <ThemeToggle inline />
          <p className="font-mono text-[10px] text-[var(--color-text-tertiary)]">FOSTER_STUDIO_PROJECT</p>
        </footer>
      </main>
    </>
  );
}

function StagedFilePreview({
  file,
  assetType,
  onClear,
}: {
  file: File;
  assetType: string | null;
  onClear: () => void;
}) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const isImage = file.type.startsWith("image/");

  useEffect(() => {
    if (!isImage) return;
    const u = URL.createObjectURL(file);
    setObjectUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file, isImage]);

  return (
    <div className="glass-subtle rounded-xl overflow-hidden">
      {isImage && objectUrl && (
        <div className="relative w-full bg-[var(--color-surface)] flex items-center justify-center" style={{ maxHeight: "120px", overflow: "hidden" }}>
          <img src={objectUrl} alt="Preview" className="w-full object-contain max-h-28" />
        </div>
      )}
      <div className="flex items-center gap-3 p-3">
        {!isImage && <File size={14} weight="thin" className="text-[var(--color-chrome-mid)] shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className="font-mono text-xs truncate text-[var(--color-text-primary)]">{file.name}</p>
          <p className="font-mono text-[10px] text-[var(--color-text-tertiary)] mt-0.5">
            {assetType?.toUpperCase()} // {formatFileSize(file.size)} // READY
          </p>
        </div>
        <button
          onClick={onClear}
          className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors shrink-0"
        >
          <X size={13} weight="thin" />
        </button>
      </div>
    </div>
  );
}
