import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT, pdfPrompt } from "@/lib/prompts/critique";
import type { AnalysisResult } from "@/lib/schemas/analysis";
import { parseClaudeResponse } from "@/lib/analysis/parse";

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export async function analysePDF(
  fileBuffer: Buffer,
  fileName: string,
  hasBrandGuideline: boolean
): Promise<Omit<AnalysisResult, "id" | "brandAlignment" | "meta">> {
  const base64 = fileBuffer.toString("base64");
  const client = getClient();

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: base64 },
          },
          { type: "text", text: pdfPrompt(hasBrandGuideline) },
        ],
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return parseClaudeResponse(text);
}
