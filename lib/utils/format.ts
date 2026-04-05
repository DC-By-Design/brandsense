import type { Score } from "@/lib/schemas/analysis";

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function scoreLabel(score: Score): string {
  const map: Record<Score, string> = {
    strong: "Strong",
    "good-with-risks": "Good with risks",
    "needs-work": "Needs work",
    "high-risk": "High risk",
  };
  return map[score];
}

export function scoreColor(score: Score): string {
  const map: Record<Score, string> = {
    strong: "text-[var(--color-strong)]",
    "good-with-risks": "text-[var(--color-accent)]",
    "needs-work": "text-[var(--color-needs-work)]",
    "high-risk": "text-[var(--color-high-risk)]",
  };
  return map[score];
}

export function scoreDotColor(score: Score): string {
  const map: Record<Score, string> = {
    strong: "bg-[var(--color-strong)]",
    "good-with-risks": "bg-[var(--color-accent)]",
    "needs-work": "bg-[var(--color-needs-work)]",
    "high-risk": "bg-[var(--color-high-risk)]",
  };
  return map[score];
}
