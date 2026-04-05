"use client";

import type { AnalysisResult } from "@/lib/schemas/analysis";

interface StreamEvent {
  type: "progress" | "result" | "error" | "asset_stored";
  step?: string;
  value?: number;
  data?: AnalysisResult;
  message?: string;
  url?: string;
}

interface RunAnalysisParams {
  file?: File;
  url?: string;
  brandGuideline?: File;
  guidelineId?: string;
  context?: string;
  onProgress?: (progress: number) => void;
  onAssetStored?: (url: string) => void;
}

export async function runAnalysis(params: RunAnalysisParams): Promise<AnalysisResult> {
  const { file, url, brandGuideline, guidelineId, context, onProgress, onAssetStored } = params;

  const form = new FormData();
  if (file) form.append("file", file);
  if (url) form.append("url", url);
  if (brandGuideline) form.append("brandGuideline", brandGuideline);
  if (guidelineId) form.append("guidelineId", guidelineId);
  if (context) form.append("context", context);

  const res = await fetch("/api/analyse", {
    method: "POST",
    body: form,
  });

  if (!res.ok || !res.body) {
    throw new Error(`Request failed (${res.status})`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      let event: StreamEvent;
      try {
        event = JSON.parse(trimmed) as StreamEvent;
      } catch {
        continue;
      }

      if (event.type === "progress" && event.value !== undefined) {
        onProgress?.(event.value);
      }

      if (event.type === "asset_stored" && event.url) {
        onAssetStored?.(event.url);
      }

      if (event.type === "result" && event.data) {
        onProgress?.(100);
        return event.data;
      }

      if (event.type === "error") {
        throw new Error(event.message ?? "Analysis failed");
      }
    }
  }

  throw new Error("Stream ended without a result");
}
