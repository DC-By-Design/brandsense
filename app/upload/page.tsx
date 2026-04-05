"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useReviewStore } from "@/lib/store/review";
import { runAnalysis } from "@/lib/analysis/client";
import { PageFooter } from "@/components/ui/PageFooter";

const STEPS = [
  { id: "READ", label: "READING_ASSET" },
  { id: "DETECT", label: "DETECTING_TYPE" },
  { id: "ANALYSE", label: "RUNNING_ANALYSIS" },
  { id: "CRITIQUE", label: "GENERATING_CRITIQUE" },
  { id: "BUILD", label: "BUILDING_REPORT" },
];

export default function UploadPage() {
  const router = useRouter();
  const { phase, input, progress, error, startAnalysis, setProgress, setResult, setAssetStorageUrl, setError } = useReviewStore();
  const hasStarted = useRef(false);

  useEffect(() => { if (phase === "idle" || !input) router.replace("/"); }, [phase, input, router]);

  useEffect(() => {
    if (hasStarted.current || !input || phase === "idle") return;
    hasStarted.current = true;
    startAnalysis();
    const params = input.type === "url"
      ? { url: input.url, brandGuideline: input.brandGuideline, guidelineId: input.guidelineId, context: input.context }
      : { file: input.file, brandGuideline: input.brandGuideline, guidelineId: input.guidelineId, context: input.context };
    runAnalysis({ ...params, onProgress: setProgress, onAssetStored: setAssetStorageUrl })
      .then(setResult)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "ANALYSIS_FAILED"));
  }, [input, phase, startAnalysis, setProgress, setResult, setError]);

  useEffect(() => { if (phase === "results") router.push("/review"); }, [phase, router]);

  if (!input) return null;

  const label = input.type === "url" ? input.url : input.file.name;
  const activeStep = Math.min(Math.floor((progress / 100) * STEPS.length), STEPS.length - 1);

  if (phase === "error") {
    return (
      <main className="min-h-dvh flex flex-col bg-[var(--color-bg)] scanlines">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-4 pt-12">
          <p className="font-mono text-xs text-[var(--color-high-risk)] tracking-widest">// {error ?? "ANALYSIS_FAILED"}</p>
          <button onClick={() => router.push("/")} className="font-mono text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
            &gt; RETRY
          </button>
        </div>
        <PageFooter />
      </main>
    );
  }

  return (
    <main className="min-h-dvh flex flex-col bg-[var(--color-bg)] scanlines">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-12">
        <div className="w-full max-w-xs flex flex-col gap-8">

          <div className="flex flex-col gap-1">
            <p className="font-mono text-[10px] text-[var(--color-text-tertiary)] truncate">{label}</p>
            <p className="font-mono text-xs text-[var(--color-accent)] cursor tracking-wider">
              {STEPS[activeStep]?.label}
            </p>
          </div>

          {/* Progress */}
          <div className="flex flex-col gap-2">
            <div className="h-px w-full bg-[var(--color-border)] relative overflow-hidden">
              <div
                className="h-full bg-[var(--color-accent)] transition-all duration-500 ease-out absolute left-0 top-0"
                style={{ width: `${progress}%`, boxShadow: "0 0 8px var(--color-accent)" }}
              />
            </div>
            <div className="flex justify-between">
              <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">{Math.round(progress)}%</span>
              <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">{phase.toUpperCase()}</span>
            </div>
          </div>

          {/* Steps */}
          <div className="flex flex-col gap-2">
            {STEPS.map((step, i) => (
              <div key={step.id} className="flex items-center gap-3">
                <div className={cn(
                  "w-1 h-1 shrink-0 transition-all duration-300",
                  i < activeStep ? "bg-[var(--color-text-tertiary)]" : i === activeStep ? "bg-[var(--color-accent)]" : "bg-[var(--color-border)]"
                )} style={i === activeStep ? { boxShadow: "0 0 6px var(--color-accent)" } : {}} />
                <span className={`font-mono text-xs tracking-wider transition-colors ${
                  i < activeStep ? "text-[var(--color-text-tertiary)]"
                  : i === activeStep ? "text-[var(--color-text-primary)]"
                  : "text-[var(--color-border)]"
                }`}>
                  {i < activeStep && <span className="mr-1.5">✓</span>}
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <PageFooter />
    </main>
  );
}

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function Header() {
  return (
    <div className="fixed top-0 inset-x-0 z-30 header-strip">
      <div className="max-w-2xl mx-auto px-6 h-12 flex items-center justify-between gap-4">
        <span className="font-mono text-xs tracking-widest text-[var(--color-chrome)] uppercase">BRAND_SENSE</span>
        <span className="font-mono text-[10px] text-[var(--color-text-tertiary)] tracking-widest">PROCESSING</span>
      </div>
    </div>
  );
}
