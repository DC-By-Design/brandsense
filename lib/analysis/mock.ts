import type { AnalysisResult } from "@/lib/schemas/analysis";
import type { AssetType } from "@/lib/schemas/analysis";
import { randomUUID } from "crypto";

export function mockAnalysisResult(
  assetType: AssetType,
  fileName?: string,
  url?: string
): AnalysisResult {
  return {
    id: randomUUID(),
    firstGlance: "⚠ MOCK DATA — no GEMINI_API_KEY found.",
    description: "Create .env.local with GEMINI_API_KEY=AIza... and restart the server. Get a free key at aistudio.google.com/apikey.",
    summary: "This is mock data. Add GEMINI_API_KEY to .env.local to get real analysis.",
    score: "good-with-risks",
    metrics: {
      dimensions: "Unknown — mock data",
      fileType: "Unknown — mock data",
      fonts: [],
      colours: ["#mock"],
      colourSpace: "Unknown — mock data",
      textToImageRatio: "Unknown — mock data",
      spellingErrors: [],
      printMarks: null,
    },
    observations: [
      {
        label: "Clear focal point",
        detail: "The subject reads immediately — no ambiguity about what the image is.",
        type: "strength",
        category: "composition",
        confidence: "high",
      },
      {
        label: "CTA lacks urgency",
        detail: "\"Learn more\" communicates nothing. Replace with the specific action and benefit.",
        type: "risk",
        category: "copy",
        confidence: "high",
      },
      {
        label: "Body text contrast fails WCAG AA",
        detail: "Estimated 3.1:1 ratio. Minimum required is 4.5:1.",
        type: "risk",
        category: "accessibility",
        confidence: "medium",
      },
      {
        label: "No visual hierarchy on mobile",
        detail: "Headline and body render at the same perceived weight below 600px.",
        type: "risk",
        category: "typography",
        confidence: "medium",
      },
    ],
    fixNext: [
      {
        label: "Replace \"Learn more\" with a specific action",
        why: "Vague CTAs reduce conversion. State what the user gets.",
      },
      {
        label: "Increase body text contrast to 4.5:1 minimum",
        why: "Current ratio fails WCAG AA — affects 8% of users.",
      },
      {
        label: "Increase size differential between headline and body on mobile",
        why: "Visual hierarchy breaks below 600px. Headline should be 1.6× body size.",
      },
    ],
    notes: [
      "The value proposition reads like a draft — technically present, emotionally absent.",
      "\"Transform your business\" appeared on 40,000 landing pages this year. Cut it.",
      "No trust signals above the fold. Visitors have no reason to stay.",
    ],
    brandAlignment: null,
    meta: {
      assetType,
      fileName,
      url,
      confidence: "medium",
      analysedAt: new Date().toISOString(),
    },
  };
}
