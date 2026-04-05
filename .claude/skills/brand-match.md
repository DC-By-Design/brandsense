# Skill: Brand Matching

## Purpose
Compare an uploaded asset against an uploaded brand guideline PDF to identify alignment and violations.

## Brand Token Extraction (from PDF)
Parse the guideline for:
```ts
type BrandTokens = {
  colours: { name: string; hex: string; usage: string }[]
  fonts: { name: string; weight: string; usage: 'heading' | 'body' | 'accent' }[]
  toneKeywords: string[]          // e.g. "bold", "minimal", "trusted"
  logoRules: string[]             // e.g. "minimum clear space", "no dark backgrounds"
  imageStyle: string[]            // e.g. "real people", "no stock photos", "natural light"
  doNot: string[]                 // explicit prohibitions
}
```

## Matching Logic
For each asset, compare:
1. **Colour match**: extract palette → compare against brand colours
   - Exact match: ✓
   - Close match (within ΔE 10): ✓ with note
   - No match: flag as risk
2. **Typography**: detect fonts → compare against brand fonts
   - If detectable: compare names
   - If not detectable: flag as "unverifiable"
3. **Tone**: extract copy → compare against tone keywords
4. **Image style**: describe visual style → compare against image style rules
5. **Do-not violations**: explicitly check each prohibition

## Scoring Brand Alignment
```
90-100%  → Aligned
70-89%   → Minor deviations
50-69%   → Significant drift
<50%     → Off-brand
```

## Without a Guideline
If no guideline provided:
- Skip brand alignment section
- Do not attempt to infer a brand from the asset
- Surface "No brand guideline provided — brand alignment not assessed" clearly in the output
