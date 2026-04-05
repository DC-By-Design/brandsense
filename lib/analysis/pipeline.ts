import { randomUUID } from "crypto";
import { analyseImage, analysePDF, analyseURL } from "@/lib/analysis/gemini";
import { mockAnalysisResult } from "@/lib/analysis/mock";
import type { AnalysisResult, AssetType } from "@/lib/schemas/analysis";
import type { BrandData } from "@/lib/analysis/brand-extract";

export type PipelineInput =
  | { type: "image"; buffer: Buffer; mimeType: string; fileName: string; brandGuideline?: Buffer; brandData?: BrandData; context?: string }
  | { type: "pdf"; buffer: Buffer; fileName: string; brandGuideline?: Buffer; brandData?: BrandData; context?: string }
  | { type: "url"; url: string; brandGuideline?: Buffer; brandData?: BrandData; context?: string }
  | { type: "video"; buffer: Buffer; fileName: string; brandGuideline?: Buffer; brandData?: BrandData; context?: string };

export async function runPipeline(input: PipelineInput): Promise<AnalysisResult> {
  const hasBrandGuideline = "brandGuideline" in input && !!input.brandGuideline;
  const id = randomUUID();
  const analysedAt = new Date().toISOString();

  if (!process.env.GEMINI_API_KEY) {
    console.warn("[preflight] GEMINI_API_KEY not set — using mock");
    const assetType: AssetType = input.type === "video" ? "video" : input.type;
    return mockAnalysisResult(assetType, "fileName" in input ? input.fileName : undefined, "url" in input ? input.url : undefined);
  }

  let partial: Omit<AnalysisResult, "id" | "brandAlignment" | "meta">;

  switch (input.type) {
    case "image":
      partial = await analyseImage(input.buffer, input.mimeType, input.fileName, hasBrandGuideline, input.context, "brandData" in input ? input.brandData : undefined);
      break;
    case "pdf":
      partial = await analysePDF(input.buffer, input.fileName, hasBrandGuideline, input.context, "brandData" in input ? input.brandData : undefined);
      break;
    case "url":
      partial = await analyseURL(input.url, hasBrandGuideline, input.context, "brandData" in input ? input.brandData : undefined);
      break;
    case "video":
      partial = {
        firstGlance: "Eye goes to the video thumbnail — no frame analysis available.",
        description: "A video file. Export a still frame as JPG or PNG for a full visual review.",
        summary: "Video analysis is not supported. Upload a still frame as JPG or PNG.",
        score: "needs-work",
        metrics: { dimensions: "N/A — video", fileType: "Video", fonts: [], colours: [], colourSpace: "Unknown", textToImageRatio: "N/A — video", spellingErrors: [], printMarks: null },
        observations: [{ label: "Video analysis unavailable", detail: "Export a key frame and upload as an image.", type: "risk", category: "production", confidence: "high" }],
        fixNext: [{ label: "Export a still frame", why: "Upload as JPG or PNG for a full visual review." }],
        notes: [],
      };
      break;
  }

  return {
    id,
    ...partial,
    brandAlignment: null,
    meta: {
      assetType: input.type === "video" ? "video" : input.type,
      fileName: "fileName" in input ? input.fileName : undefined,
      url: "url" in input ? input.url : undefined,
      confidence: "high",
      analysedAt,
    },
  };
}
