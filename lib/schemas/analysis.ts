import { z } from "zod";

export const AssetTypeSchema = z.enum([
  "image",
  "pdf",
  "video",
  "url",
]);

export const ConfidenceSchema = z.enum(["high", "medium", "low"]);

export const ScoreSchema = z.enum([
  "strong",
  "good-with-risks",
  "needs-work",
  "high-risk",
]);

export const ObservationCategorySchema = z.enum([
  "colour",
  "composition",
  "typography",
  "copy",
  "accessibility",
  "engagement",
  "platform",
  "production",
]);

export const ObservationRegionSchema = z.enum([
  "top-left", "top-center", "top-right",
  "middle-left", "center", "middle-right",
  "bottom-left", "bottom-center", "bottom-right",
  "full",
]);

export const ObservationSchema = z.object({
  label: z.string(),
  detail: z.string(),
  type: z.enum(["strength", "risk"]),
  category: ObservationCategorySchema,
  confidence: ConfidenceSchema,
  region: ObservationRegionSchema.optional(),
});

export const ActionSchema = z.object({
  label: z.string(),
  why: z.string(),
});

export const PrintMarksSchema = z.object({
  detected: z.boolean(),
  bleed: z.string().optional(),
  cropMarks: z.boolean().optional(),
  foldMarks: z.boolean().optional(),
  registrationMarks: z.boolean().optional(),
  colourBars: z.boolean().optional(),
  notes: z.string().optional(),
});

export const AssetMetricsSchema = z.object({
  dimensions: z.string(),
  fileType: z.string(),
  fonts: z.array(z.string()),
  colours: z.array(z.string()),
  colourSpace: z.string(),
  textToImageRatio: z.string(),
  spellingErrors: z.array(z.string()),
  printMarks: PrintMarksSchema.nullable(),
});

export const AnalysisResultSchema = z.object({
  id: z.string(),
  firstGlance: z.string(),
  description: z.string(),
  summary: z.string(),
  score: ScoreSchema,
  metrics: AssetMetricsSchema.nullable(),
  observations: z.array(ObservationSchema),
  fixNext: z.array(ActionSchema).max(3),
  notes: z.array(z.string()),
  brandAlignment: z
    .object({
      score: z.number().min(0).max(100),
      label: z.string(),
      notes: z.array(z.string()),
    })
    .nullable(),
  meta: z.object({
    assetType: AssetTypeSchema,
    fileName: z.string().optional(),
    url: z.string().optional(),
    confidence: ConfidenceSchema,
    analysedAt: z.string(),
  }),
});

export type AssetType = z.infer<typeof AssetTypeSchema>;
export type Score = z.infer<typeof ScoreSchema>;
export type Confidence = z.infer<typeof ConfidenceSchema>;
export type ObservationCategory = z.infer<typeof ObservationCategorySchema>;
export type Observation = z.infer<typeof ObservationSchema>;
export type Action = z.infer<typeof ActionSchema>;
export type AssetMetrics = z.infer<typeof AssetMetricsSchema>;
export type PrintMarks = z.infer<typeof PrintMarksSchema>;
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
