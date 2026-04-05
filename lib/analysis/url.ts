import Anthropic from "@anthropic-ai/sdk";
import { load } from "cheerio";
import { SYSTEM_PROMPT, urlPrompt } from "@/lib/prompts/critique";
import type { AnalysisResult } from "@/lib/schemas/analysis";
import { parseClaudeResponse } from "@/lib/analysis/parse";

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

async function fetchPageContent(url: string) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; Preflight-Bot/1.0)" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Could not fetch URL (${res.status})`);

  const html = await res.text();
  const $ = load(html);
  $("script, style, noscript, svg, nav, footer, iframe").remove();

  const title = $("title").text().trim();
  const metaDescription = $('meta[name="description"]').attr("content")?.trim() ?? "";
  const headings: string[] = [];
  $("h1, h2, h3").each((_, el) => { const t = $(el).text().trim(); if (t) headings.push(t); });
  const bodyText = $("main, article, section, body").first().text().replace(/\s+/g, " ").trim().slice(0, 3000);
  const ctaText: string[] = [];
  $("button, a[class*='cta'], a[class*='btn'], a[class*='button']").each((_, el) => {
    const t = $(el).text().trim();
    if (t && t.length < 80) ctaText.push(t);
  });

  return { title, metaDescription, headings: headings.slice(0, 20), bodyText, ctaText: [...new Set(ctaText)].slice(0, 10) };
}

export async function analyseURL(
  url: string,
  hasBrandGuideline: boolean
): Promise<Omit<AnalysisResult, "id" | "brandAlignment" | "meta">> {
  const content = await fetchPageContent(url);
  const client = getClient();

  const pageSummary = `URL: ${url}
PAGE TITLE: ${content.title || "Not found"}
META DESCRIPTION: ${content.metaDescription || "Not set"}
HEADINGS:\n${content.headings.map((h) => `- ${h}`).join("\n") || "None"}
CTAS:\n${content.ctaText.map((c) => `- ${c}`).join("\n") || "None"}
BODY:\n${content.bodyText || "Could not extract"}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: `${urlPrompt(url, hasBrandGuideline)}\n\n---\n\n${pageSummary}` }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return parseClaudeResponse(text);
}
