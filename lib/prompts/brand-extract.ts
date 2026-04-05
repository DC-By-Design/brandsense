export const BRAND_EXTRACT_PROMPT = `You are extracting brand standards from a brand guideline document. Your job is to pull out every rule, token, and instruction and return it as structured JSON.

Be thorough. If the document specifies hex codes, capture them exactly. If it names fonts, capture the exact names and weights. If it describes tone of voice, capture the actual language used.

Return ONLY valid JSON. No markdown fences. No extra text.

{
  "brandName": "Brand name as written in the document, or null if not found",
  "summary": "1–2 sentence description of the brand based on the guidelines",
  "colours": [
    {
      "name": "Colour name (e.g. Primary Blue, Warm Black)",
      "hex": "Hex code if provided, or descriptive name",
      "pantone": "Pantone reference if provided, or null",
      "cmyk": "CMYK values if provided, or null",
      "rgb": "RGB values if provided, or null",
      "usage": "What this colour is used for"
    }
  ],
  "fonts": [
    {
      "name": "Exact font name",
      "weights": "Available/approved weights e.g. 300, 400, 700 or Light, Regular, Bold",
      "usage": "Primary / Secondary / Display / Body / Mono etc.",
      "note": "Any additional usage rules, or null"
    }
  ],
  "logo": {
    "description": "Description of the logo if present in the document",
    "variants": ["List of approved logo variants e.g. Full colour, Reversed, Monochrome"],
    "clearSpace": "Clear space rule if specified",
    "minimumSize": "Minimum size rule if specified",
    "rules": ["Each do/don't rule about logo usage as a separate string"]
  },
  "toneOfVoice": {
    "weAre": ["Personality traits or values the brand embodies — short phrases"],
    "weAreNot": ["What the brand explicitly avoids or rejects — short phrases"],
    "examples": ["Any example copy, taglines, or phrases from the document"]
  },
  "photography": {
    "style": "Overall photography style description if present",
    "rules": ["Each photography guideline as a separate string"]
  },
  "spacing": {
    "gridSystem": "Grid or spacing system description if present, or null",
    "rules": ["Layout and spacing rules"]
  },
  "other": ["Any important brand standards not captured above — each as a separate string"]
}

If a section has no data in the document, return an empty array [] or null — do not invent content.`;
