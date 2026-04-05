/**
 * Background configuration for the homepage.
 * Change `mode` to switch between gradient cycling, image slideshow, or solid fill.
 *
 * To use:
 *   mode: "gradient"  → cycles through `gradients` array
 *   mode: "images"    → reads from /public/backgrounds/ folder (via /api/backgrounds)
 *   mode: "solid"     → static single colour
 */

export type BackgroundMode = "gradient" | "images" | "solid";

interface GradientBackground {
  mode: "gradient";
  /** CSS gradient strings — one per slide */
  lightGradients: string[];
  darkGradients: string[];
  /** Milliseconds between slides */
  interval: number;
  /** Milliseconds for cross-fade transition */
  transition: number;
}

interface ImagesBackground {
  mode: "images";
  interval: number;
  transition: number;
}

interface SolidBackground {
  mode: "solid";
  lightColor: string;
  darkColor: string;
}

export type BackgroundConfig = GradientBackground | ImagesBackground | SolidBackground;

// ─── Active configuration ────────────────────────────────────────────────────
// Change `mode` here to switch background style.

export const backgroundConfig: BackgroundConfig = {
  mode: "gradient",

  lightGradients: [
    "linear-gradient(135deg, #f0ebe4 0%, #e8e2db 50%, #ede7df 100%)",
    "linear-gradient(135deg, #eaecef 0%, #e3e6ec 50%, #dde0e8 100%)",
    "linear-gradient(135deg, #e8edea 0%, #e1e8e4 50%, #dae4de 100%)",
    "linear-gradient(135deg, #f0e8e6 0%, #ece1de 50%, #e8d9d5 100%)",
    "linear-gradient(135deg, #f2ece2 0%, #ece4d8 50%, #e6dccf 100%)",
  ],

  darkGradients: [
    "linear-gradient(135deg, #111114 0%, #0e0e11 50%, #131316 100%)",
    "linear-gradient(135deg, #0c0d12 0%, #0e0f16 50%, #10111c 100%)",
    "linear-gradient(135deg, #110f0d 0%, #130f0c 50%, #100e0b 100%)",
    "linear-gradient(135deg, #0d1015 0%, #0e1219 50%, #0b0e14 100%)",
    "linear-gradient(135deg, #111210 0%, #0f1110 50%, #0d100d 100%)",
  ],

  interval: 8000,
  transition: 1500,
};
