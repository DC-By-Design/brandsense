"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CaretDown, File, Globe } from "@phosphor-icons/react";

function isFigmaUrl(url: string): boolean {
  try { return new URL(url).hostname.endsWith("figma.com"); } catch { return false; }
}

function FigmaEmbed({ url }: { url: string }) {
  const [loaded, setLoaded] = useState(false);
  const embedUrl = `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(url)}`;
  return (
    <div className="relative w-full bg-[var(--color-surface)]" style={{ height: 480 }}>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <p className="font-mono text-[10px] text-[var(--color-text-tertiary)] animate-pulse tracking-widest">
            LOADING_FIGMA...
          </p>
        </div>
      )}
      <iframe
        src={embedUrl}
        onLoad={() => setLoaded(true)}
        className="absolute inset-0 w-full h-full border-0"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        title="Figma design preview"
      />
    </div>
  );
}
import { PageFooter } from "@/components/ui/PageFooter";
import { cn } from "@/lib/utils/cn";
import { scoreLabel, scoreDotColor, scoreColor } from "@/lib/utils/format";
import type { AnalysisResult, AssetMetrics, Observation, PrintMarks } from "@/lib/schemas/analysis";

interface SavedSession {
  id: string;
  assetType: string;
  fileName: string | null;
  assetUrl: string | null;
  context: string | null;
  savedAt: string;
  guideline: { id: string; label: string } | null;
  result: AnalysisResult;
}

export default function SavedReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<SavedSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/sessions/${id}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d: { session: SavedSession }) => { setSession(d.session); setLoading(false); })
      .catch(() => router.replace("/dashboard"));
  }, [id, router]);

  if (loading) {
    return (
      <main className="min-h-dvh flex items-center justify-center bg-[var(--color-bg)] scanlines">
        <p className="font-mono text-xs text-[var(--color-text-tertiary)] tracking-widest animate-pulse">LOADING_REVIEW...</p>
      </main>
    );
  }
  if (!session) return null;

  const result = session.result;
  const name = session.fileName ?? session.assetUrl ?? "Asset";

  return (
    <main className="min-h-dvh flex flex-col bg-[var(--color-bg)] scanlines">
      <div className="fixed top-0 inset-x-0 z-30 header-strip">
        <div className="max-w-2xl mx-auto px-6 h-12 flex items-center justify-between gap-4">
          <button onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 font-mono text-[10px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
            <ArrowLeft size={11} /> DASHBOARD
          </button>
          <span className="font-mono text-xs tracking-widest text-[var(--color-chrome)] uppercase">BRAND_SENSE</span>
          <div className="flex flex-col items-end gap-0.5">
            <p className="font-mono text-[10px] text-[var(--color-text-secondary)] truncate max-w-36">{name}</p>
            <p className="font-mono text-[9px] text-[var(--color-text-tertiary)]">{new Date(session.savedAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 pt-16 pb-6 flex flex-col gap-4">

          {/* Creative preview */}
          {session.assetUrl && isFigmaUrl(session.assetUrl) && (
            <div className="glass-subtle rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-white/20">
                <p className="font-mono text-[10px] text-[var(--color-text-tertiary)] tracking-widest">FIGMA_PREVIEW</p>
              </div>
              <FigmaEmbed url={session.assetUrl} />
            </div>
          )}
          {session.assetUrl && session.assetType === "image" && !isFigmaUrl(session.assetUrl) && (
            <div className="glass-subtle rounded-xl overflow-hidden">
              <div className="relative w-full bg-[var(--color-surface)] flex items-center justify-center" style={{ maxHeight: 320 }}>
                <img
                  src={session.assetUrl}
                  alt={name}
                  className="w-full object-contain"
                  style={{ maxHeight: 320 }}
                />
              </div>
            </div>
          )}
          {session.assetUrl && session.assetType === "pdf" && !isFigmaUrl(session.assetUrl) && (
            <div className="glass-subtle rounded-xl overflow-hidden">
              <iframe
                src={`${session.assetUrl}#toolbar=0`}
                className="w-full"
                style={{ height: 320 }}
                title="PDF preview"
              />
            </div>
          )}

          {/* Asset info bar */}
          <div className="glass-subtle rounded-xl px-4 py-3 flex items-center gap-4">
            {session.assetType === "url" ? <Globe size={16} weight="thin" className="text-[var(--color-text-tertiary)] shrink-0" />
              : <File size={16} weight="thin" className="text-[var(--color-text-tertiary)] shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="font-mono text-xs text-[var(--color-text-primary)] truncate">{name}</p>
              <p className="font-mono text-[10px] text-[var(--color-text-tertiary)] mt-0.5">
                {session.assetType.toUpperCase()}
                {session.guideline && ` // ${session.guideline.label}`}
                {` // SAVED ${new Date(session.savedAt).toLocaleDateString()}`}
              </p>
            </div>
            {session.assetUrl && session.assetType === "url" && (
              <a
                href={session.assetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[10px] text-[var(--color-accent)] hover:underline shrink-0"
              >
                OPEN →
              </a>
            )}
          </div>

          {/* Dimensions + metrics callout */}
          {result.metrics && (result.metrics.dimensions || result.metrics.fileType) && (
            <div className="glass-subtle rounded-xl px-4 py-3 flex items-center gap-6 flex-wrap">
              {result.metrics.dimensions && (
                <div>
                  <p className="font-mono text-[9px] text-[var(--color-text-tertiary)] tracking-widest">DIMENSIONS</p>
                  <p className="font-mono text-sm font-semibold text-[var(--color-text-primary)] mt-0.5">{result.metrics.dimensions}</p>
                </div>
              )}
              {result.metrics.fileType && (
                <div>
                  <p className="font-mono text-[9px] text-[var(--color-text-tertiary)] tracking-widest">FILE_TYPE</p>
                  <p className="font-mono text-sm font-semibold text-[var(--color-text-primary)] mt-0.5">{result.metrics.fileType}</p>
                </div>
              )}
              {result.metrics.colourSpace && (
                <div>
                  <p className="font-mono text-[9px] text-[var(--color-text-tertiary)] tracking-widest">COLOUR_SPACE</p>
                  <p className="font-mono text-sm font-semibold text-[var(--color-text-primary)] mt-0.5">{result.metrics.colourSpace}</p>
                </div>
              )}
            </div>
          )}

          {result.firstGlance && (
            <div className="border-l-2 border-[var(--color-accent)] pl-4 flex flex-col gap-1">
              <p className="font-mono text-[10px] text-[var(--color-text-tertiary)] tracking-widest">FIRST_GLANCE //</p>
              <p className="font-mono text-xs text-[var(--color-text-secondary)] leading-relaxed italic">&ldquo;{result.firstGlance}&rdquo;</p>
            </div>
          )}

          {result.description && (
            <div className="pl-4 flex flex-col gap-1">
              <p className="font-mono text-[10px] text-[var(--color-text-tertiary)] tracking-widest">DESCRIPTION //</p>
              <p className="font-mono text-xs text-[var(--color-text-secondary)] leading-relaxed">{result.description}</p>
            </div>
          )}

          <Collapsible label={`STATUS // ${scoreLabel(result.score).toUpperCase().replace(/ /g, "_")}`} dotColor={scoreDotColor(result.score)} labelColor={scoreColor(result.score)}>
            <p className="text-sm leading-relaxed text-[var(--color-text-primary)] px-4 pb-4">{result.summary}</p>
          </Collapsible>

          {result.metrics && (
            <Collapsible label="ASSET_METRICS">
              <MetricsPanel metrics={result.metrics} />
            </Collapsible>
          )}

          {result.fixNext.length > 0 && (
            <Collapsible label={`FIX_NEXT // ${result.fixNext.length}_ACTIONS`}>
              <div>
                {result.fixNext.map((action, i) => (
                  <div key={i} className="flex items-start gap-4 px-4 py-3.5 border-b border-white/20 last:border-b-0">
                    <span className="font-mono text-[10px] text-[var(--color-accent)] shrink-0 mt-0.5 w-5 font-semibold">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{action.label}</p>
                      <p className="font-mono text-[10px] text-[var(--color-text-secondary)] mt-1 leading-relaxed">{action.why}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Collapsible>
          )}

          <FullReport result={result} />

          <p className="font-mono text-[10px] text-[var(--color-text-tertiary)]">
            TS:{new Date(result.meta.analysedAt).toISOString()} // GEMINI_2.5_FLASH // SAVED_REVIEW
          </p>
        </div>
      </div>
      <PageFooter />
    </main>
  );
}

function Collapsible({ label, children, dotColor, labelColor }: {
  label: string; children: React.ReactNode; dotColor?: string; labelColor?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-subtle rounded-xl overflow-hidden">
      <button onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/10 transition-colors">
        <div className="flex items-center gap-2">
          {dotColor && <div className={cn("w-2 h-2 rounded-full shrink-0", dotColor)} />}
          <span className={cn("font-mono text-[10px] tracking-widest", labelColor ?? "text-[var(--color-text-secondary)]")}>{label}</span>
        </div>
        <CaretDown size={11} className={cn("text-[var(--color-text-tertiary)] transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && <div className="border-t border-white/20">{children}</div>}
    </div>
  );
}

function MetricsPanel({ metrics }: { metrics: AssetMetrics }) {
  const rows = [
    { label: "DIMENSIONS", value: metrics.dimensions },
    { label: "FILE_TYPE", value: metrics.fileType },
    { label: "COLOUR_SPACE", value: metrics.colourSpace },
    { label: "TEXT_TO_IMAGE", value: metrics.textToImageRatio },
    { label: "FONTS_DETECTED", value: metrics.fonts.length ? metrics.fonts : null },
    { label: "COLOURS", value: metrics.colours.length ? metrics.colours : null },
    { label: "SPELLING_ERRORS", value: metrics.spellingErrors.length ? metrics.spellingErrors : null, isError: true },
  ];
  return (
    <div>
      {rows.map((row, i) => (
        row.value == null ? null :
        <div key={row.label} className={cn("flex items-start gap-4 px-4 py-3", i < rows.length - 1 && "border-b border-white/20")}>
          <span className="font-mono text-[10px] text-[var(--color-text-tertiary)] shrink-0 w-36 pt-0.5 tracking-wider">{row.label}</span>
          <div className="flex-1">
            {typeof row.value === "string" ? (
              <span className="font-mono text-xs text-[var(--color-text-primary)]">{row.value}</span>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {(row.value as string[]).map((v, j) => (
                  <span key={j} className={cn("font-mono text-[10px] px-2 py-0.5 border rounded-full",
                    row.isError ? "border-[var(--color-high-risk)] text-[var(--color-high-risk)]" : "border-white/30 text-[var(--color-text-secondary)]"
                  )}>{v}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
      {metrics.printMarks && <PrintMarksRow marks={metrics.printMarks} />}
    </div>
  );
}

function PrintMarksRow({ marks }: { marks: PrintMarks }) {
  return (
    <div className="flex items-start gap-4 px-4 py-3">
      <span className="font-mono text-[10px] text-[var(--color-text-tertiary)] shrink-0 w-36 pt-0.5 tracking-wider">PRINT_MARKS</span>
      <div className="flex-1 flex flex-col gap-1.5">
        {!marks.detected ? <span className="font-mono text-xs text-[var(--color-text-tertiary)]">none detected</span> : (
          <div className="flex flex-wrap gap-1.5">
            {marks.bleed && <span className="font-mono text-[10px] px-2 py-0.5 border border-white/30 rounded-full text-[var(--color-text-secondary)]">BLEED: {marks.bleed}</span>}
            {marks.cropMarks && <span className="font-mono text-[10px] px-2 py-0.5 border border-white/30 rounded-full text-[var(--color-text-secondary)]">CROP</span>}
            {marks.registrationMarks && <span className="font-mono text-[10px] px-2 py-0.5 border border-white/30 rounded-full text-[var(--color-text-secondary)]">REG</span>}
          </div>
        )}
        {marks.notes && <p className="font-mono text-[10px] text-[var(--color-text-secondary)] leading-relaxed">{marks.notes}</p>}
      </div>
    </div>
  );
}

function FullReport({ result }: { result: AnalysisResult }) {
  const [open, setOpen] = useState(false);
  const strengths = result.observations.filter((o) => o.type === "strength");
  const risks = result.observations.filter((o) => o.type === "risk");
  if (strengths.length === 0 && risks.length === 0 && result.notes.length === 0) return null;
  return (
    <div className="glass-subtle rounded-xl overflow-hidden">
      <button onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/10 transition-colors">
        <span className="font-mono text-[10px] tracking-widest text-[var(--color-text-secondary)]">
          {open ? "COLLAPSE_REPORT" : `FULL_REPORT // ${result.observations.length}_OBSERVATIONS`}
        </span>
        <CaretDown size={11} className={cn("text-[var(--color-text-tertiary)] transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && (
        <div className="border-t border-white/20">
          {risks.length > 0 && <ObsBlock label="RISKS" items={risks} />}
          {strengths.length > 0 && <ObsBlock label="STRENGTHS" items={strengths} />}
          {result.notes.length > 0 && (
            <div className="px-4 py-4 border-t border-white/20">
              <p className="font-mono text-[10px] text-[var(--color-text-tertiary)] tracking-widest mb-3">CD_NOTES //</p>
              <ul className="flex flex-col gap-2">
                {result.notes.map((note, i) => (
                  <li key={i} className="flex items-start gap-3 font-mono text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    <span className="text-[var(--color-accent)] shrink-0">&gt;</span>{note}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ObsBlock({ label, items }: { label: string; items: Observation[] }) {
  return (
    <div className="px-4 py-4 border-t border-white/20 first:border-t-0">
      <p className="font-mono text-[10px] text-[var(--color-text-tertiary)] tracking-widest mb-3">{label} //</p>
      <div className="flex flex-col gap-3">
        {items.map((obs, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className={cn("w-1.5 h-1.5 rounded-full shrink-0 mt-1.5",
              obs.type === "strength" ? "bg-[var(--color-strong)]" : "bg-[var(--color-high-risk)]")} />
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">{obs.label}</p>
              <p className="font-mono text-[10px] text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">{obs.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
