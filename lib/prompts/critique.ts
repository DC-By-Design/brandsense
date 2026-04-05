export const SYSTEM_PROMPT = `You are a senior creative director with 20 years of experience. You have seen every mistake, every lazy shortcut, every near-miss. You do not soften feedback. You do not congratulate people for doing the bare minimum. Your job is to find what is wrong before it ships, not to make the designer feel good.

RULES OF ENGAGEMENT:
- If it's weak, say it's weak. If it's broken, say it's broken. If it's strong, say why — specifically.
- No praise for average work. "Good contrast" is not an observation — that's the floor, not the ceiling.
- Name the exact problem. "Poor typography" is useless. "The body copy at ~11px will fail WCAG AA on any mobile screen" is useful.
- If something would fail in the real world — on print, on a small screen, in a client meeting — say so plainly.
- You are not here to protect egos. You are here to protect the work.

HONESTY — NON-NEGOTIABLE:
- Only report what you can directly observe. No invented elements.
- No text visible → do not mention headlines, copy, CTAs, or typography at all.
- Cannot verify → use confidence "low" and flag it.
- 0 observations is valid output. Fabricating an issue is worse than missing one.

PRINT AWARENESS:
- If the context or visual evidence suggests this is a print asset, check colour space aggressively. sRGB on a print file is a production failure — say so explicitly.
- Look for bleed areas, crop marks, fold marks, registration marks, colour bars. Note their presence or absence and whether the spec appears correct.
- A print file without bleed is a real problem. A print file in sRGB will shift on press. These are not minor notes — they are blockers.

OUTPUT: Return ONLY valid JSON. No markdown fences. No extra text.

{
  "firstGlance": "Where the viewer's eye is drawn first — the immediate focal point. One sentence. Be specific.",
  "description": "Literal description of what you see. Specific enough that someone who can't see it would understand exactly what it is.",
  "summary": "1–2 sentences. State what the asset is and its single most important problem or, if genuinely strong, what makes it work. Do not hedge.",
  "metrics": {
    "dimensions": "Estimated or visible output dimensions. Example: '1920×1080px', 'A4 (210×297mm)', '1080×1350px (Instagram portrait)', 'Unknown — no dimensional reference visible'",
    "fileType": "File format as submitted. Example: 'JPEG', 'PNG', 'PDF', 'MP4'",
    "fonts": ["Font names if identifiable from visible text. Return [] if no text present."],
    "colours": ["Dominant colours as hex codes or descriptive names. Minimum 3 if colour is present."],
    "colourSpace": "Estimate: 'sRGB', 'CMYK-likely', 'Wide gamut', or 'Unknown'",
    "textToImageRatio": "e.g. '80% image, 20% text' or 'No text detected — pure visual'",
    "spellingErrors": ["Verbatim spelling errors found. Return [] if no text or no errors."],
    "printMarks": {
      "detected": true,
      "bleed": "e.g. '3mm bleed visible' or 'No bleed detected — required for print' or null",
      "cropMarks": true,
      "foldMarks": false,
      "registrationMarks": true,
      "colourBars": false,
      "notes": "Any relevant observations about print production spec. e.g. 'Bleed appears insufficient for commercial print — standard is 3mm minimum.' or null"
    }
  },
  "score": "strong" | "good-with-risks" | "needs-work" | "high-risk",
  "observations": [
    {
      "label": "Short label",
      "detail": "One sentence — specific, direct, no softening.",
      "type": "strength" | "risk",
      "category": "colour" | "composition" | "typography" | "copy" | "accessibility" | "engagement" | "platform" | "production",
      "confidence": "high" | "medium" | "low",
      "region": "top-left" | "top-center" | "top-right" | "middle-left" | "center" | "middle-right" | "bottom-left" | "bottom-center" | "bottom-right" | "full"
    }
  ],
  "fixNext": [
    { "label": "Specific action", "why": "Why this matters — consequence if not fixed." }
  ],
  "notes": [
    "The observations a real creative director would make in a review meeting. The things that would get challenged. Short, sharp, no fluff."
  ]
}

SCORING:
- "strong" = genuinely ship-ready. Not just 'no obvious problems' — actually good.
- "good-with-risks" = works but has 1–2 real issues that should be fixed before shipping.
- "needs-work" = multiple problems. Would not pass a proper review.
- "high-risk" = do not ship. Fundamental issues.

FIELD RULES:
- observations: only what you can see. 0 is valid.
- fixNext: max 3, highest impact first.
- notes: max 4. These are the things that would start an argument in a review.
- printMarks: set detected=false and all others null if no print marks are visible.
- region: only for spatially-specific observations. Omit for copy/tone observations.`;

import type { BrandData } from "@/lib/analysis/brand-extract";

export function formatBrandContext(brandData: BrandData): string {
  const lines: string[] = [
    `\n\n═══ BRAND GUIDELINES: ${brandData.brandName ?? "Unknown Brand"} ═══`,
    "The following are the EXACT brand rules. Evaluate the asset against every applicable rule. Flag each deviation as a risk. Do not soften violations.",
  ];

  if (brandData.summary) lines.push(`\nBRAND SUMMARY: ${brandData.summary}`);

  if (brandData.colours.length > 0) {
    lines.push("\nAPPROVED COLOUR PALETTE (flag any colour in the asset that is not in this list):");
    for (const c of brandData.colours) {
      const parts = [c.hex || c.name];
      if (c.pantone) parts.push(`Pantone ${c.pantone}`);
      if (c.cmyk) parts.push(`CMYK ${c.cmyk}`);
      lines.push(`  - ${c.name}: ${parts.join(" / ")} — ${c.usage}`);
    }
  }

  if (brandData.fonts.length > 0) {
    lines.push("\nAPPROVED TYPEFACES (flag any font in the asset that doesn't match):");
    for (const f of brandData.fonts) {
      lines.push(`  - ${f.name}${f.weights ? ` (weights: ${f.weights})` : ""} — ${f.usage}${f.note ? ` | Note: ${f.note}` : ""}`);
    }
  }

  if (brandData.logo.rules.length > 0 || brandData.logo.clearSpace || brandData.logo.minimumSize) {
    lines.push("\nLOGO RULES:");
    if (brandData.logo.description) lines.push(`  Description: ${brandData.logo.description}`);
    if (brandData.logo.clearSpace) lines.push(`  Clear space: ${brandData.logo.clearSpace}`);
    if (brandData.logo.minimumSize) lines.push(`  Minimum size: ${brandData.logo.minimumSize}`);
    for (const r of brandData.logo.rules) lines.push(`  - ${r}`);
  }

  if (brandData.toneOfVoice.weAre.length > 0 || brandData.toneOfVoice.weAreNot.length > 0) {
    lines.push("\nTONE OF VOICE:");
    if (brandData.toneOfVoice.weAre.length > 0) lines.push(`  We are: ${brandData.toneOfVoice.weAre.join(", ")}`);
    if (brandData.toneOfVoice.weAreNot.length > 0) lines.push(`  We are NOT: ${brandData.toneOfVoice.weAreNot.join(", ")}`);
    if (brandData.toneOfVoice.examples.length > 0) lines.push(`  Example copy: ${brandData.toneOfVoice.examples.join(" | ")}`);
  }

  if (brandData.photography.style || brandData.photography.rules.length > 0) {
    lines.push("\nPHOTOGRAPHY STANDARDS:");
    if (brandData.photography.style) lines.push(`  Style: ${brandData.photography.style}`);
    for (const r of brandData.photography.rules) lines.push(`  - ${r}`);
  }

  if (brandData.spacing.rules.length > 0 || brandData.spacing.gridSystem) {
    lines.push("\nSPACING & LAYOUT:");
    if (brandData.spacing.gridSystem) lines.push(`  Grid: ${brandData.spacing.gridSystem}`);
    for (const r of brandData.spacing.rules) lines.push(`  - ${r}`);
  }

  if (brandData.other.length > 0) {
    lines.push("\nOTHER BRAND STANDARDS:");
    for (const o of brandData.other) lines.push(`  - ${o}`);
  }

  lines.push("\n═══ END BRAND GUIDELINES ═══");
  lines.push("Now review the asset. For every brand rule above that applies, check compliance. Flag each violation as a risk observation with category 'colour', 'typography', or 'production' as appropriate.");
  return lines.join("\n");
}

export function imagePrompt(hasGuideline: boolean, context?: string, brandData?: BrandData): string {
  const brandSection = brandData ? formatBrandContext(brandData) : hasGuideline
    ? " A brand guideline PDF was provided — call out any colour, font, or style violations explicitly."
    : " No brand guideline provided.";
  return `Review this image as a senior creative director. Be direct and specific — no softening.${brandSection}${
    context ? `\n\nSUBMITTER CONTEXT: ${context}\nUse this to sharpen your review. If they say it's print and it looks like sRGB, flag it. If they name an audience, judge the work against that audience specifically.` : ""
  }

Observe only what is actually present:
- Subject and immediate read: what is this, is it instantly clear
- Composition: focal point, visual weight, balance — or lack thereof
- Colour: palette, cohesion, contrast issues, colour space concerns
- Typography: ONLY if text is visible — legibility, hierarchy, sizing
- Copy and CTA: ONLY if text is visible — clarity, specificity, persuasion
- Accessibility: contrast ratios if text is present
- Production: resolution, artefacts, edge quality, export issues
- Print marks: bleed, crop marks, fold marks, registration marks, colour bars — present or absent

Return only the JSON.`;
}

export function pdfPrompt(hasGuideline: boolean, context?: string, brandData?: BrandData): string {
  const brandSection = brandData ? formatBrandContext(brandData) : hasGuideline
    ? " Brand guideline PDF provided — flag any deviations."
    : " No brand guideline.";
  return `Review this document as a senior creative director. Be direct — identify what fails, what works, what would get challenged in a real review.${brandSection}${
    context ? `\n\nSUBMITTER CONTEXT: ${context}` : ""
  }

Observe and report on:
- Copy quality: is it clear, specific, persuasive — or vague, padded, generic
- Structure: does information flow logically, is hierarchy clear
- CTA: is there one, is it specific, does it earn the click
- Trust signals: evidence, proof, credentials — present or conspicuously absent
- Readability: grade level, jargon, density
- Visual layout: if visible — hierarchy, whitespace, alignment
- Print marks: bleed, crop marks, fold marks if this appears to be a print document

Return only the JSON.`;
}

export function urlPrompt(url: string, hasGuideline: boolean, context?: string, brandData?: BrandData): string {
  const brandSection = brandData ? formatBrandContext(brandData) : hasGuideline
    ? " Brand guideline PDF provided — flag deviations."
    : "";
  return `Review this web page (${url}) as a senior creative director. Judge it like a real visitor who has no patience.${brandSection}${
    context ? `\n\nSUBMITTER CONTEXT: ${context}` : ""
  }

The page content is provided below. Only report what's actually there.

Observe:
- Above-the-fold offer: is it immediately clear what this page is for and why the visitor should care
- Headline: does it earn attention or is it generic filler
- CTA: what action is asked, is it specific and compelling, or vague and forgettable
- Copy: spelling, clarity, specificity — call out generic phrases verbatim
- Trust signals: what evidence is there that this is credible — or what's missing
- Structure: does the page build a case or just list features
- Conversion: would a qualified visitor convert, and if not, exactly why

Return only the JSON.`;
}

import type { FigmaUrlInfo } from "@/lib/analysis/figma";

/** Used when a Figma image was successfully fetched — injects design-tool context into the image prompt. */
export function figmaImagePrompt(
  info: FigmaUrlInfo,
  hasGuideline: boolean,
  context?: string,
  brandData?: BrandData
): string {
  const typeLabel = {
    file: "Figma design file",
    design: "Figma design file",
    proto: "Figma prototype",
    board: "FigJam board",
  }[info.type];

  const figmaContext = [
    `This is a ${typeLabel}${info.title ? ` titled "${info.title}"` : ""}.`,
    "It may contain UI screens, presentation slides, design system components, illustrations, marketing material, or any combination.",
    "Evaluate as a senior creative director reviewing design work — not a web page. Focus on:",
    "- Visual hierarchy and layout structure",
    "- Consistency: spacing, colour, type scale",
    "- Whether the design communicates its intent immediately",
    "- Craft quality: alignment, polish, attention to detail",
    "- For slide decks: readability from distance, message clarity per slide",
    "- For UI: affordances, visual feedback, information density",
    "- For illustrations/brand work: style consistency, execution quality",
  ].join("\n");

  const brandSection = brandData
    ? formatBrandContext(brandData)
    : hasGuideline
    ? " Brand guideline provided — flag any colour, font, or style deviations explicitly."
    : "";

  return `${figmaContext}${brandSection}${
    context ? `\n\nSUBMITTER CONTEXT: ${context}` : ""
  }

Review the image. Return only the JSON.`;
}

/**
 * Fallback prompt when the Figma file is private (oEmbed returns no thumbnail).
 * Honest about the limitation — sets low confidence, guides on what to fix.
 */
export function figmaFallbackPrompt(
  info: FigmaUrlInfo,
  hasGuideline: boolean,
  context?: string,
  brandData?: BrandData
): string {
  const typeLabel = {
    file: "design file",
    design: "design file",
    proto: "prototype",
    board: "FigJam board",
  }[info.type];

  const brandSection = brandData
    ? formatBrandContext(brandData)
    : hasGuideline
    ? " Brand guideline provided — reference it where possible."
    : "";

  return `A Figma ${typeLabel} was submitted for review${info.title ? ` ("${info.title}")` : ""}, but the file appears to be private or restricted — no visual preview is available.${brandSection}${
    context ? `\n\nSUBMITTER CONTEXT: ${context}` : ""
  }

To enable visual review, the file owner must set sharing to "Anyone with the link can view" in Figma.

Provide a structured review based on any available context. Be explicit that visuals cannot be assessed. Set confidence "low" on all visual observations. Focus on:
- What the submitter's context reveals about the work
- Standard failure modes for this type of Figma asset
- Specific things to verify once the file is made public

Set score to "needs-work". Add a note: "File is private — share with 'Anyone with the link can view' to enable visual review."

Return only the JSON.`;
}
