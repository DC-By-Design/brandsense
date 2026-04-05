"use client";

import { create } from "zustand";
import type { AnalysisResult } from "@/lib/schemas/analysis";

export type ReviewPhase = "idle" | "uploading" | "analysing" | "results" | "error";

type UploadInput =
  | { type: "file"; file: File; brandGuideline?: File; guidelineId?: string; context?: string }
  | { type: "url"; url: string; brandGuideline?: File; guidelineId?: string; context?: string };

interface ReviewState {
  phase: ReviewPhase;
  input: UploadInput | null;
  result: AnalysisResult | null;
  assetStorageUrl: string | null;
  error: string | null;
  progress: number; // 0–100 during analysing

  setInput: (input: UploadInput) => void;
  startUpload: () => void;
  startAnalysis: () => void;
  setProgress: (progress: number) => void;
  setResult: (result: AnalysisResult) => void;
  setAssetStorageUrl: (url: string) => void;
  setError: (error: string) => void;
  reset: () => void;
}

const initialState = {
  phase: "idle" as ReviewPhase,
  input: null,
  result: null,
  assetStorageUrl: null,
  error: null,
  progress: 0,
};

export const useReviewStore = create<ReviewState>((set) => ({
  ...initialState,

  setInput: (input) => set({ input }),

  startUpload: () =>
    set({ phase: "uploading", error: null, progress: 0 }),

  startAnalysis: () =>
    set({ phase: "analysing", error: null, progress: 0 }),

  setProgress: (progress) => set({ progress }),

  setResult: (result) =>
    set({ phase: "results", result, progress: 100 }),

  setAssetStorageUrl: (url) => set({ assetStorageUrl: url }),

  setError: (error) => set({ phase: "error", error }),

  reset: () => set(initialState),
}));
