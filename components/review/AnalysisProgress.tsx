"use client";

import { cn } from "@/lib/utils/cn";
import type { ReviewPhase } from "@/lib/store/review";

interface AnalysisProgressProps {
  progress: number;
  phase: string;
}

const STEPS = [
  { label: "Reading asset", threshold: 10 },
  { label: "Checking composition", threshold: 30 },
  { label: "Analysing copy & colour", threshold: 50 },
  { label: "Running creative review", threshold: 70 },
  { label: "Building report", threshold: 90 },
  { label: "Done", threshold: 100 },
];

export function AnalysisProgress({ progress, phase }: AnalysisProgressProps) {
  const currentStep = STEPS.findIndex((s) => progress < s.threshold);
  const activeStep = currentStep === -1 ? STEPS.length - 1 : currentStep;

  return (
    <div className="flex flex-col gap-6">
      {/* Progress bar */}
      <div className="h-0.5 w-full bg-[var(--color-border)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--color-text-primary)] rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step list */}
      <div className="flex flex-col gap-2.5">
        {STEPS.slice(0, -1).map((step, i) => {
          const done = i < activeStep;
          const active = i === activeStep;
          return (
            <div
              key={step.label}
              className={cn(
                "flex items-center gap-3 text-sm transition-all duration-300",
                done && "text-[var(--color-text-tertiary)]",
                active && "text-[var(--color-text-primary)]",
                !done && !active && "text-[var(--color-text-tertiary)] opacity-40"
              )}
            >
              <div
                className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-300",
                  done && "bg-[var(--color-text-tertiary)]",
                  active && "bg-[var(--color-text-primary)] scale-125",
                  !done && !active && "bg-[var(--color-border)]"
                )}
              />
              {step.label}
              {active && phase === "analysing" && (
                <span className="text-[var(--color-text-tertiary)] text-xs animate-pulse">
                  …
                </span>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-[var(--color-text-tertiary)]">
        This takes 10–30 seconds
      </p>
    </div>
  );
}
