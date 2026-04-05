import OpenAI from "openai";
import { SYSTEM_PROMPT, imagePrompt } from "@/lib/prompts/critique";
import type { AnalysisResult } from "@/lib/schemas/analysis";
import { parseClaudeResponse } from "@/lib/analysis/parse";

// Lazy — only constructed when a key exists
function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

type SupportedImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";
const SUPPORTED: SupportedImageMediaType[] = ["image/jpeg", "image/png", "image/gif", "image/webp"];

function isSupported(t: string): t is SupportedImageMediaType {
  return (SUPPORTED as string[]).includes(t);
}

export async function analyseImage(
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string,
  hasBrandGuideline: boolean
): Promise<Omit<AnalysisResult, "id" | "brandAlignment" | "meta">> {
  if (!isSupported(mimeType)) throw new Error(`Unsupported image type: ${mimeType}`);

  const base64 = fileBuffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64}`;

  const client = getClient();
  const response = await client.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 4096,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
          { type: "text", text: imagePrompt(hasBrandGuideline) },
        ],
      },
    ],
  });

  const text = response.choices[0]?.message?.content ?? "";
  return parseClaudeResponse(text);
}
