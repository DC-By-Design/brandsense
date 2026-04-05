import { GoogleGenAI, type Part } from "@google/genai";
import { SYSTEM_PROMPT, imagePrompt, pdfPrompt, urlPrompt, figmaImagePrompt, figmaFallbackPrompt } from "@/lib/prompts/critique";
import { parseClaudeResponse } from "@/lib/analysis/parse";
import { parseFigmaUrl, fetchFigmaImage } from "@/lib/analysis/figma";
import { load } from "cheerio";
import type { AnalysisResult } from "@/lib/schemas/analysis";
import type { BrandData } from "@/lib/analysis/brand-extract";

type PartialResult = Omit<AnalysisResult, "id" | "brandAlignment" | "meta">;

function getClient() {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

async function generate(parts: Part[]): Promise<string> {
  const client = getClient();
  const response = await client.models.generateContent({
    model: "gemini-2.5-flash",
    config: { systemInstruction: SYSTEM_PROMPT, maxOutputTokens: 8192 },
    contents: [{ role: "user", parts }],
  });
  return response.text ?? "";
}

export async function analyseImage(
  buffer: Buffer,
  mimeType: string,
  _fileName: string,
  hasBrandGuideline: boolean,
  context?: string,
  brandData?: BrandData,
): Promise<PartialResult> {
  const text = await generate([
    {
      inlineData: {
        mimeType: mimeType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
        data: buffer.toString("base64"),
      },
    },
    { text: imagePrompt(hasBrandGuideline, context, brandData) },
  ]);
  return parseClaudeResponse(text);
}

export async function analysePDF(
  buffer: Buffer,
  _fileName: string,
  hasBrandGuideline: boolean,
  context?: string,
  brandData?: BrandData,
): Promise<PartialResult> {
  const text = await generate([
    { inlineData: { mimeType: "application/pdf", data: buffer.toString("base64") } },
    { text: pdfPrompt(hasBrandGuideline, context, brandData) },
  ]);
  return parseClaudeResponse(text);
}

export async function analyseURL(
  url: string,
  hasBrandGuideline: boolean,
  context?: string,
  brandData?: BrandData,
): Promise<PartialResult> {
  // Figma URLs need visual export — HTML scraping returns nothing useful
  const figmaInfo = parseFigmaUrl(url);
  if (figmaInfo) {
    const image = await fetchFigmaImage(figmaInfo, url);
    if (image) {
      // Full visual analysis with Figma-aware prompt
      const text = await generate([
        {
          inlineData: {
            mimeType: image.mimeType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
            data: image.buffer.toString("base64"),
          },
        },
        { text: figmaImagePrompt(figmaInfo, hasBrandGuideline, context, brandData) },
      ]);
      return parseClaudeResponse(text);
    }
    // No token or API error — text-only fallback
    const text = await generate([
      { text: figmaFallbackPrompt(figmaInfo, hasBrandGuideline, context, brandData) },
    ]);
    return parseClaudeResponse(text);
  }

  // Regular web page — scrape HTML
  const content = await fetchPageContent(url);
  const text = await generate([
    { text: `${urlPrompt(url, hasBrandGuideline, context, brandData)}\n\n---\n\n${content}` },
  ]);
  return parseClaudeResponse(text);
}

async function fetchPageContent(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; Preflight-Bot/1.0)" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Could not fetch URL (${res.status})`);

  const html = await res.text();
  const $ = load(html);
  $("script, style, noscript, svg, nav, footer, iframe").remove();

  const title = $("title").text().trim();
  const meta = $('meta[name="description"]').attr("content")?.trim() ?? "";
  const headings: string[] = [];
  $("h1, h2, h3").each((_, el) => { const t = $(el).text().trim(); if (t) headings.push(t); });
  const body = $("main, article, section, body").first().text().replace(/\s+/g, " ").trim().slice(0, 3000);
  const ctas: string[] = [];
  $("button, a[class*='cta'], a[class*='btn']").each((_, el) => {
    const t = $(el).text().trim();
    if (t && t.length < 80) ctas.push(t);
  });

  return `URL: ${url}
TITLE: ${title || "None"}
META: ${meta || "None"}
HEADINGS:\n${headings.slice(0, 15).map((h) => `- ${h}`).join("\n") || "None"}
CTAS:\n${[...new Set(ctas)].slice(0, 8).map((c) => `- ${c}`).join("\n") || "None"}
BODY:\n${body}`;
}
