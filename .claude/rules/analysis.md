# Analysis Engine Rules

## Module Contracts
Each analysis module exports one primary async function with a typed return:

```ts
// Pattern every module follows
export async function analyseX(input: XInput): Promise<AnalysisResult>
```

## Shared Result Type
```ts
type AnalysisResult = {
  summary: string
  score: 'strong' | 'good-with-risks' | 'needs-work' | 'high-risk'
  strengths: Insight[]
  risks: Insight[]
  fixNext: Action[]        // max 3
  sections: SectionResult[]
  creativeDirector: CDNotes
  meta: {
    assetType: AssetType
    confidence: 'high' | 'medium' | 'low'
    analysedAt: string     // ISO
  }
}

type Insight = { label: string; detail: string; confidence: 'high' | 'medium' | 'low' }
type Action = { label: string; why: string }
type CDNotes = { weak: string[]; generic: string[]; offBrand: string[]; performanceRisks: string[] }
```

## Module Responsibilities
- `images.ts` → visual composition, colour, typography, hierarchy, accessibility
- `pdf.ts` → copy quality, layout, colour, brand alignment if guideline provided
- `url.ts` → screenshot → image analysis + copy scraping
- `colour.ts` → extract palette, check contrast, identify issues
- `typography.ts` → font detection, size hierarchy, readability
- `brand-match.ts` → compare asset tokens against brand guideline tokens
- `accessibility.ts` → contrast ratios, text size, readability metrics
- `scoring.ts` → aggregate module scores into top-level score

## Prompts
- All Claude prompts in `lib/prompts/`.
- Prompts return structured JSON — use Claude's `tool_use` or explicit JSON instructions.
- Tone directive in every prompt: "You are a senior creative director. Be direct. No praise. No fluff. Identify what's weak, what's off-brand, what would fail a real review."

## No Tight Coupling
- Analysis modules do NOT call each other directly.
- Orchestration happens in `lib/analysis/pipeline.ts`.
- Brand context is injected as a parameter — modules don't fetch it themselves.
