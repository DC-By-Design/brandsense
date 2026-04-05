"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useReviewStore } from "@/lib/store/review";
import { cn } from "@/lib/utils/cn";
import { scoreLabel, scoreDotColor, scoreColor } from "@/lib/utils/format";
import { ArrowLeft, CaretDown, File, Globe, FloppyDisk, SquaresFour } from "@phosphor-icons/react";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { PageFooter } from "@/components/ui/PageFooter";
import { createClient } from "@/lib/supabase/client";
import type { AnalysisResult, AssetMetrics, Observation, PrintMarks } from "@/lib/schemas/analysis";

type StoreInput =
  | { type: "file"; file: File; brandGuideline?: File; guidelineId?: string; context?: string }
  | { type: "url"; url: string; brandGuideline?: File; guidelineId?: string; context?: string };

function SaveButton({ result, input, assetStorageUrl }: { result: AnalysisResult; input: StoreInput; assetStorageUrl: string | null }) {
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const supabase = createClient();

  async function save() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) { window.location.href = "/auth"; return; }
    setState("saving");
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assetType: result.meta.assetType,
        fileName: result.meta.fileName,
        assetUrl: assetStorageUrl ?? result.meta.url ?? null,
        context: input.context,
        guidelineId: input.guidelineId ?? null,
        result,
      }),
    });
    setState(res.ok ? "saved" : "error");
  }

  if (state === "saved") {
    return <span className="font-mono text-[10px] text-[var(--color-strong)] tracking-widest">SAVED ✓</span>;
  }

  return (
    <button
      onClick={save}
      disabled={state === "saving"}
      className="flex items-center gap-1.5 font-mono text-[10px] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors disabled:opacity-40"
    >
      <FloppyDisk size={12} weight="thin" />
      {state === "saving" ? "SAVING..." : state === "error" ? "RETRY_SAVE" : "SAVE_REVIEW"}
    </button>
  );
}

export default function ReviewPage() {
  const router = useRouter();
  const { phase, result, input, assetStorageUrl, reset } = useReviewStore();
  const [actualDims, setActualDims] = useState<string | null>(null);

  useEffect(() => {
    if (phase !== "results" || !result) router.replace("/");
  }, [phase, result, router]);

  useEffect(() => {
    if (input?.type !== "file" || !input.file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(input.file);
    const img = new window.Image();
    img.onload = () => { setActualDims(`${img.naturalWidth} × ${img.naturalHeight}`); URL.revokeObjectURL(url); };
    img.src = url;
  }, [input]);

  if (!result || !input) return null;

  const fileSize = input.type === "file" ? input.file.size : undefined;

  return (
    <main className="min-h-dvh flex flex-col scanlines">
      <div className="fixed top-0 inset-x-0 z-30 header-strip">
        <div className="max-w-2xl mx-auto px-6 h-12 flex items-center justify-between gap-4">
          <button onClick={() => { reset(); router.push("/"); }}
            className="flex items-center gap-2 font-mono text-[10px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
            <ArrowLeft size={11} /> NEW
          </button>
          <span className="font-mono text-xs tracking-widest text-[var(--color-chrome)] uppercase">BRAND_SENSE</span>
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/dashboard")}
              className="flex items-center gap-1.5 font-mono text-[10px] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors">
              <SquaresFour size={12} /> DASHBOARD
            </button>
            <SaveButton result={result} input={input} assetStorageUrl={assetStorageUrl} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 pt-16 pb-6 flex flex-col gap-4">

          {/* Asset preview */}
          <ScrollReveal><AssetPreview input={input} /></ScrollReveal>

          {/* First glance — eye direction, always visible */}
          {result.firstGlance && (
            <ScrollReveal delay={60}>
              <div className="border-l-2 border-[var(--color-accent)] pl-4 flex flex-col gap-1">
                <p className="font-mono text-[10px] text-[var(--color-text-tertiary)] tracking-widest">FIRST_GLANCE //</p>
                <p className="font-mono text-xs text-[var(--color-text-secondary)] leading-relaxed italic">
                  &ldquo;{result.firstGlance}&rdquo;
                </p>
              </div>
            </ScrollReveal>
          )}

          {/* Description — what the AI sees, always visible */}
          {result.description && (
            <ScrollReveal delay={80}>
              <div className="pl-4 flex flex-col gap-1">
                <p className="font-mono text-[10px] text-[var(--color-text-tertiary)] tracking-widest">DESCRIPTION //</p>
                <p className="font-mono text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  {result.description}
                </p>
              </div>
            </ScrollReveal>
          )}

          {/* Status — collapsible */}
          <ScrollReveal delay={100}>
            <Collapsible label={`STATUS // ${scoreLabel(result.score).toUpperCase().replace(/ /g, "_")}`} dotColor={scoreDotColor(result.score)} labelColor={scoreColor(result.score)}>
              <p className="text-sm leading-relaxed text-[var(--color-text-primary)] px-4 pb-4">{result.summary}</p>
            </Collapsible>
          </ScrollReveal>

          {/* Metrics — collapsible */}
          {result.metrics && (
            <ScrollReveal delay={120}>
              <Collapsible label="ASSET_METRICS">
                <MetricsPanel metrics={result.metrics} actualDims={actualDims} fileSize={fileSize} />
              </Collapsible>
            </ScrollReveal>
          )}

          {/* Fix next — collapsible */}
          {result.fixNext.length > 0 && (
            <ScrollReveal delay={140}>
              <Collapsible label={`FIX_NEXT // ${result.fixNext.length}_ACTIONS`}>
                <div>
                  {result.fixNext.map((action, i) => (
                    <div key={i} className="flex items-start gap-4 px-4 py-3.5 border-b border-[var(--color-border)] last:border-b-0">
                      <span className="font-mono text-[10px] text-[var(--color-accent)] shrink-0 mt-0.5 w-5 font-semibold">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">{action.label}</p>
                        <p className="font-mono text-[10px] text-[var(--color-text-secondary)] mt-1 leading-relaxed">{action.why}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Collapsible>
            </ScrollReveal>
          )}

          {/* Markup view — collapsible, image only */}
          <MarkupView result={result} input={input} />

          {/* Full report — collapsible */}
          <FullReport result={result} />

          <p className="font-mono text-[10px] text-[var(--color-text-tertiary)]">
            TS:{new Date(result.meta.analysedAt).toISOString()} // FOSTER_STUDIO_PROJECT
          </p>
        </div>
      </div>
      <PageFooter />
    </main>
  );
}

function Collapsible({
  label,
  children,
  dotColor,
  labelColor,
}: {
  label: string;
  children: React.ReactNode;
  dotColor?: string;
  labelColor?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-subtle rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          {dotColor && <div className={cn("w-2 h-2 rounded-full shrink-0", dotColor)} />}
          <span className={cn("font-mono text-[10px] tracking-widest", labelColor ?? "text-[var(--color-text-secondary)]")}>
            {label}
          </span>
        </div>
        <CaretDown size={11} className={cn("text-[var(--color-text-tertiary)] transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && <div className="border-t border-white/20">{children}</div>}
    </div>
  );
}

function isFigmaUrl(url: string): boolean {
  try { return new URL(url).hostname.endsWith("figma.com"); } catch { return false; }
}

function figmaEmbedUrl(url: string): string {
  return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(url)}`;
}

function FigmaEmbed({ url }: { url: string }) {
  const [loaded, setLoaded] = useState(false);
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
        src={figmaEmbedUrl(url)}
        onLoad={() => setLoaded(true)}
        className="absolute inset-0 w-full h-full border-0"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        title="Figma design preview"
      />
    </div>
  );
}

function AssetPreview({ input }: { input: StoreInput }) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const isImage = input.type === "file" && input.file.type.startsWith("image/");
  const isVideo = input.type === "file" && input.file.type.startsWith("video/");
  const isPDF = input.type === "file" && input.file.type === "application/pdf";
  const name = input.type === "file" ? input.file.name : input.url;
  const isFigma = input.type === "url" && isFigmaUrl(input.url);

  useEffect(() => {
    if (input.type !== "file") return;
    const u = URL.createObjectURL(input.file);
    setObjectUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [input]);

  return (
    <div className="glass-subtle rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/20">
        <p className="font-mono text-[10px] text-[var(--color-text-tertiary)] tracking-widest">
          {isFigma ? "FIGMA_PREVIEW" : "ASSET_PREVIEW"}
        </p>
        <p className="font-mono text-[10px] text-[var(--color-text-secondary)] truncate max-w-xs">{name}</p>
      </div>
      {isFigma ? (
        <FigmaEmbed url={(input as { type: "url"; url: string }).url} />
      ) : (
        <div className="p-4 flex items-center justify-center min-h-48 bg-black/5">
          {isImage && objectUrl && <img src={objectUrl} alt="Asset" className="max-w-full max-h-80 object-contain rounded-lg shadow-sm" />}
          {isVideo && objectUrl && <video src={objectUrl} controls className="max-w-full max-h-80 rounded-lg" />}
          {isPDF && (
            <div className="flex flex-col items-center gap-3 py-8 text-[var(--color-text-tertiary)]">
              <File size={40} weight="thin" />
              <p className="font-mono text-[10px]">PDF document</p>
            </div>
          )}
          {input.type === "url" && !isFigma && (
            <div className="flex flex-col items-center gap-3 py-8 text-[var(--color-text-tertiary)]">
              <Globe size={40} weight="thin" />
              <p className="font-mono text-[10px] break-all text-center max-w-xs">{input.url}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MetricsPanel({ metrics, actualDims, fileSize }: {
  metrics: AssetMetrics;
  actualDims?: string | null;
  fileSize?: number;
}) {
  const fileSizeStr = fileSize
    ? fileSize >= 1024 * 1024
      ? `${(fileSize / 1024 / 1024).toFixed(1)} MB`
      : `${(fileSize / 1024).toFixed(0)} KB`
    : null;

  const rows: { label: string; value: string | string[] | null; isEmpty?: boolean; isError?: boolean }[] = [
    { label: "DIMENSIONS", value: actualDims ?? metrics.dimensions ?? null },
    { label: "FILE_SIZE", value: fileSizeStr },
    { label: "FILE_TYPE", value: metrics.fileType },
    { label: "COLOUR_SPACE", value: metrics.colourSpace },
    { label: "TEXT_TO_IMAGE", value: metrics.textToImageRatio },
    { label: "FONTS_DETECTED", value: metrics.fonts.length ? metrics.fonts : [], isEmpty: metrics.fonts.length === 0 },
    { label: "COLOURS", value: metrics.colours.length ? metrics.colours : [], isEmpty: metrics.colours.length === 0 },
    { label: "SPELLING_ERRORS", value: metrics.spellingErrors.length ? metrics.spellingErrors : [], isEmpty: metrics.spellingErrors.length === 0, isError: true },
  ].filter((r) => r.value !== null) as { label: string; value: string | string[]; isEmpty?: boolean; isError?: boolean }[];

  return (
    <div>
      {rows.map((row, i) => (
        <div key={row.label} className={cn(
          "flex items-start gap-4 px-4 py-3",
          (i < rows.length - 1 || metrics.printMarks) && "border-b border-[var(--color-border)]"
        )}>
          <span className="font-mono text-[10px] text-[var(--color-text-tertiary)] shrink-0 w-36 pt-0.5 tracking-wider">
            {row.label}
          </span>
          <div className="flex-1">
            {typeof row.value === "string" ? (
              <span className="font-mono text-xs text-[var(--color-text-primary)]">{row.value}</span>
            ) : row.isEmpty ? (
              <span className="font-mono text-xs text-[var(--color-text-tertiary)]">none detected</span>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {(row.value as string[]).map((v, j) => (
                  <span key={j} className={cn(
                    "font-mono text-[10px] px-2 py-0.5 border",
                    row.isError
                      ? "border-[var(--color-high-risk)] text-[var(--color-high-risk)] bg-[var(--color-high-risk)]/5"
                      : "border-[var(--color-border)] text-[var(--color-text-secondary)] bg-[var(--color-surface)]"
                  )}>
                    {v}
                  </span>
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
  const flags: { label: string; value: boolean | undefined }[] = [
    { label: "CROP", value: marks.cropMarks },
    { label: "FOLD", value: marks.foldMarks },
    { label: "REG", value: marks.registrationMarks },
    { label: "COLOUR_BAR", value: marks.colourBars },
  ];

  return (
    <div className="flex items-start gap-4 px-4 py-3">
      <span className="font-mono text-[10px] text-[var(--color-text-tertiary)] shrink-0 w-36 pt-0.5 tracking-wider">
        PRINT_MARKS
      </span>
      <div className="flex-1 flex flex-col gap-1.5">
        {!marks.detected ? (
          <span className="font-mono text-xs text-[var(--color-text-tertiary)]">none detected</span>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {marks.bleed && (
              <span className="font-mono text-[10px] px-2 py-0.5 border border-[var(--color-border)] text-[var(--color-text-secondary)] bg-[var(--color-surface)]">
                BLEED: {marks.bleed}
              </span>
            )}
            {flags.filter(f => f.value).map(f => (
              <span key={f.label} className="font-mono text-[10px] px-2 py-0.5 border border-[var(--color-border)] text-[var(--color-text-secondary)] bg-[var(--color-surface)]">
                {f.label}
              </span>
            ))}
          </div>
        )}
        {marks.notes && (
          <p className={cn(
            "font-mono text-[10px] leading-relaxed",
            marks.notes.toLowerCase().includes("fail") || marks.notes.toLowerCase().includes("missing") || marks.notes.toLowerCase().includes("insufficient")
              ? "text-[var(--color-high-risk)]"
              : "text-[var(--color-text-secondary)]"
          )}>
            {marks.notes}
          </p>
        )}
      </div>
    </div>
  );
}

const REGION_POS: Record<string, { x: number; y: number }> = {
  "top-left":     { x: 22, y: 20 },
  "top-center":   { x: 50, y: 20 },
  "top-right":    { x: 78, y: 20 },
  "middle-left":  { x: 22, y: 50 },
  "center":       { x: 50, y: 50 },
  "middle-right": { x: 78, y: 50 },
  "bottom-left":  { x: 22, y: 80 },
  "bottom-center":{ x: 50, y: 80 },
  "bottom-right": { x: 78, y: 80 },
  "full":         { x: 50, y: 50 },
};

function MarkupView({ result, input }: { result: AnalysisResult; input: StoreInput }) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [activePin, setActivePin] = useState<number | null>(null);

  const isImage = input.type === "file" && input.file.type.startsWith("image/");

  useEffect(() => {
    if (!isImage || input.type !== "file") return;
    const u = URL.createObjectURL(input.file);
    setObjectUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [input, isImage]);

  if (!isImage) return null;

  const annotated = result.observations.filter((o) => o.region);
  if (annotated.length === 0) return null;

  return (
    <Collapsible label={`VIEW_MARKUP // ${annotated.length}_ANNOTATIONS`}>
      <div className="p-4 flex flex-col gap-4">
        {objectUrl && (
          <div className="relative w-full">
            <img src={objectUrl} alt="Annotated asset" className="w-full object-contain max-h-96" />
            {annotated.map((obs, i) => {
              const pos = REGION_POS[obs.region ?? "center"];
              const isRisk = obs.type === "risk";
              const isActive = activePin === i;
              return (
                <button
                  key={i}
                  onClick={() => setActivePin(isActive ? null : i)}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  className={cn(
                    "absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 font-mono text-[9px] font-bold flex items-center justify-center transition-all duration-150 border",
                    isRisk
                      ? "bg-[var(--color-high-risk)] border-[var(--color-high-risk)] text-white"
                      : "bg-[var(--color-strong)] border-[var(--color-strong)] text-white",
                    isActive ? "scale-125 z-10 shadow-lg" : "opacity-90 hover:opacity-100 hover:scale-110",
                  )}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex flex-col">
          {annotated.map((obs, i) => (
            <button
              key={i}
              onClick={() => setActivePin(activePin === i ? null : i)}
              className={cn(
                "flex items-start gap-3 py-3 border-b border-[var(--color-border)] last:border-b-0 text-left transition-opacity w-full",
                activePin !== null && activePin !== i ? "opacity-30" : "opacity-100"
              )}
            >
              <span className={cn(
                "font-mono text-[9px] font-bold w-5 h-5 flex items-center justify-center shrink-0 mt-0.5",
                obs.type === "risk" ? "bg-[var(--color-high-risk)] text-white" : "bg-[var(--color-strong)] text-white"
              )}>
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">{obs.label}</p>
                <p className="font-mono text-[10px] text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">{obs.detail}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Collapsible>
  );
}

function FullReport({ result }: { result: AnalysisResult }) {
  const [open, setOpen] = useState(false);
  const strengths = result.observations.filter((o) => o.type === "strength");
  const risks = result.observations.filter((o) => o.type === "risk");
  if (strengths.length === 0 && risks.length === 0 && result.notes.length === 0) return null;

  return (
    <div className="glass-subtle rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/10 transition-colors"
      >
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
            <div className="px-4 py-4 border-t border-white/20 first:border-t-0">
              <p className="font-mono text-[10px] text-[var(--color-text-tertiary)] tracking-widest mb-3">CD_NOTES //</p>
              <ul className="flex flex-col gap-2">
                {result.notes.map((note, i) => (
                  <li key={i} className="flex items-start gap-3 font-mono text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    <span className="text-[var(--color-accent)] shrink-0">&gt;</span>
                    {note}
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
            <div className={cn(
              "w-1.5 h-1.5 shrink-0 mt-1.5",
              obs.type === "strength" ? "bg-[var(--color-strong)]" : "bg-[var(--color-high-risk)]"
            )} />
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">{obs.label}</p>
              <p className="font-mono text-[10px] text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">{obs.detail}</p>
              {obs.confidence !== "high" && (
                <p className="font-mono text-[10px] text-[var(--color-text-tertiary)] mt-1">CONF_{obs.confidence.toUpperCase()}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
