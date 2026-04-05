import { GoogleGenAI } from "@google/genai";
import { BRAND_EXTRACT_PROMPT } from "@/lib/prompts/brand-extract";

export interface BrandColour {
  name: string;
  hex: string;
  pantone?: string | null;
  cmyk?: string | null;
  rgb?: string | null;
  usage: string;
}

export interface BrandFont {
  name: string;
  weights?: string;
  usage: string;
  note?: string | null;
}

export interface BrandDataHistoryEntry {
  field: string;
  prev: string;
  next: string;
  updatedAt: string;
}

export interface BrandData {
  brandName: string | null;
  summary: string | null;
  colours: BrandColour[];
  fonts: BrandFont[];
  logo: {
    description?: string | null;
    primaryUrl?: string | null;
    variants: string[];
    variantAssets?: Record<string, string>;
    clearSpace?: string | null;
    minimumSize?: string | null;
    rules: string[];
  };
  toneOfVoice: {
    weAre: string[];
    weAreNot: string[];
    examples: string[];
  };
  photography: {
    style?: string | null;
    rules: string[];
    references?: string[];
  };
  printDigital?: 'print' | 'digital' | 'both' | null;
  spacing: {
    gridSystem?: string | null;
    rules: string[];
  };
  other: string[];
  _history?: BrandDataHistoryEntry[];
}

function getClient() {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

function ensureArray(val: unknown): unknown[] {
  return Array.isArray(val) ? val : [];
}

function ensureString(val: unknown): string | null {
  if (val == null) return null;
  const s = String(val).trim();
  return s || null;
}

export async function extractBrandData(pdfBuffer: Buffer): Promise<BrandData> {
  const client = getClient();
  const response = await client.models.generateContent({
    model: "gemini-2.5-flash",
    config: { maxOutputTokens: 8192 },
    contents: [{
      role: "user",
      parts: [
        { inlineData: { mimeType: "application/pdf", data: pdfBuffer.toString("base64") } },
        { text: BRAND_EXTRACT_PROMPT },
      ],
    }],
  });

  const text = (response.text ?? "").replace(/^```(?:json)?\s*/m, "").replace(/\s*```\s*$/m, "").trim();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error("Could not parse brand extraction response");
  }

  const logo = (parsed.logo ?? {}) as Record<string, unknown>;
  const tov = (parsed.toneOfVoice ?? {}) as Record<string, unknown>;
  const photo = (parsed.photography ?? {}) as Record<string, unknown>;
  const spacing = (parsed.spacing ?? {}) as Record<string, unknown>;

  return {
    brandName: ensureString(parsed.brandName),
    summary: ensureString(parsed.summary),
    colours: ensureArray(parsed.colours).map((c) => {
      const col = c as Record<string, unknown>;
      return {
        name: String(col.name ?? ""),
        hex: String(col.hex ?? ""),
        pantone: ensureString(col.pantone),
        cmyk: ensureString(col.cmyk),
        rgb: ensureString(col.rgb),
        usage: String(col.usage ?? ""),
      };
    }),
    fonts: ensureArray(parsed.fonts).map((f) => {
      const font = f as Record<string, unknown>;
      return {
        name: String(font.name ?? ""),
        weights: font.weights ? String(font.weights) : undefined,
        usage: String(font.usage ?? ""),
        note: ensureString(font.note),
      };
    }),
    logo: {
      description: ensureString(logo.description),
      variants: ensureArray(logo.variants).map(String),
      clearSpace: ensureString(logo.clearSpace),
      minimumSize: ensureString(logo.minimumSize),
      rules: ensureArray(logo.rules).map(String),
    },
    toneOfVoice: {
      weAre: ensureArray(tov.weAre).map(String),
      weAreNot: ensureArray(tov.weAreNot).map(String),
      examples: ensureArray(tov.examples).map(String),
    },
    photography: {
      style: ensureString(photo.style),
      rules: ensureArray(photo.rules).map(String),
    },
    spacing: {
      gridSystem: ensureString(spacing.gridSystem),
      rules: ensureArray(spacing.rules).map(String),
    },
    other: ensureArray(parsed.other).map(String),
  };
}
