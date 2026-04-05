import type { AnalysisResult } from "@/lib/schemas/analysis";

type PartialResult = Omit<AnalysisResult, "id" | "brandAlignment" | "meta">;

export function parseClaudeResponse(text: string): PartialResult {
  const cleaned = text
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Could not parse analysis response: ${cleaned.slice(0, 200)}`);
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Analysis response is not an object");
  }

  const r = parsed as Record<string, unknown>;

  if (!r.summary || !r.score) {
    throw new Error("Analysis response missing summary or score");
  }

  const ensureArray = (val: unknown): unknown[] => (Array.isArray(val) ? val : []);

  const rawMetrics = r.metrics as Record<string, unknown> | null | undefined;

  let printMarks: AnalysisResult["metrics"] extends null | undefined ? never : NonNullable<AnalysisResult["metrics"]>["printMarks"] = null;
  if (rawMetrics) {
    const pm = rawMetrics.printMarks as Record<string, unknown> | null | undefined;
    if (pm && pm.detected !== undefined) {
      printMarks = {
        detected: Boolean(pm.detected),
        bleed: pm.bleed != null ? String(pm.bleed) : undefined,
        cropMarks: pm.cropMarks != null ? Boolean(pm.cropMarks) : undefined,
        foldMarks: pm.foldMarks != null ? Boolean(pm.foldMarks) : undefined,
        registrationMarks: pm.registrationMarks != null ? Boolean(pm.registrationMarks) : undefined,
        colourBars: pm.colourBars != null ? Boolean(pm.colourBars) : undefined,
        notes: pm.notes != null ? String(pm.notes) : undefined,
      };
    }
  }

  return {
    firstGlance: String(r.firstGlance ?? ""),
    description: String(r.description ?? ""),
    summary: String(r.summary),
    score: (r.score as AnalysisResult["score"]) ?? "needs-work",
    metrics: rawMetrics
      ? {
          dimensions: String(rawMetrics.dimensions ?? "Unknown"),
          fileType: String(rawMetrics.fileType ?? "Unknown"),
          fonts: ensureArray(rawMetrics.fonts).map(String),
          colours: ensureArray(rawMetrics.colours).map(String),
          colourSpace: String(rawMetrics.colourSpace ?? "Unknown"),
          textToImageRatio: String(rawMetrics.textToImageRatio ?? "Unknown"),
          spellingErrors: ensureArray(rawMetrics.spellingErrors).map(String),
          printMarks,
        }
      : null,
    observations: ensureArray(r.observations) as AnalysisResult["observations"],
    fixNext: (ensureArray(r.fixNext) as AnalysisResult["fixNext"]).slice(0, 3),
    notes: ensureArray(r.notes).map(String),
  };
}
