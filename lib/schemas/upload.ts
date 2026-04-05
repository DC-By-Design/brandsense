import { z } from "zod";

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const ACCEPTED_DOC_TYPES = ["application/pdf"] as const;

export const ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;

export const ACCEPTED_TYPES = [
  ...ACCEPTED_IMAGE_TYPES,
  ...ACCEPTED_DOC_TYPES,
  ...ACCEPTED_VIDEO_TYPES,
] as const;

export type AcceptedMimeType = (typeof ACCEPTED_TYPES)[number];

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

export const UploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((f) => f.size <= MAX_FILE_SIZE_BYTES, "File exceeds 50MB limit")
    .refine(
      (f) => (ACCEPTED_TYPES as readonly string[]).includes(f.type),
      "Unsupported file type"
    ),
  brandGuideline: z
    .instanceof(File)
    .refine((f) => f.type === "application/pdf", "Brand guideline must be PDF")
    .optional(),
});

export const UrlInputSchema = z.object({
  url: z.string().url("Enter a valid URL"),
  brandGuideline: z
    .instanceof(File)
    .refine((f) => f.type === "application/pdf", "Brand guideline must be PDF")
    .optional(),
});

export function detectAssetType(
  mimeType: string
): "image" | "pdf" | "video" | null {
  if ((ACCEPTED_IMAGE_TYPES as readonly string[]).includes(mimeType))
    return "image";
  if (mimeType === "application/pdf") return "pdf";
  if ((ACCEPTED_VIDEO_TYPES as readonly string[]).includes(mimeType))
    return "video";
  return null;
}
