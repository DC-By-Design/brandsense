/**
 * Figma URL detection and visual extraction via the public oEmbed API.
 *
 * No API token required. Works for any Figma file shared with
 * "Anyone with the link can view". Private files fall back to
 * a text-only analysis with honest low-confidence scoring.
 *
 * oEmbed spec: https://www.figma.com/developers/embed
 */

export interface FigmaUrlInfo {
  fileKey: string;
  nodeId: string | null;
  type: "file" | "design" | "proto" | "board";
  title: string | null;
}

/** Returns structured info if this is a Figma URL, otherwise null. */
export function parseFigmaUrl(url: string): FigmaUrlInfo | null {
  let u: URL;
  try { u = new URL(url); } catch { return null; }
  if (!u.hostname.endsWith("figma.com")) return null;

  const match = u.pathname.match(/^\/(file|design|proto|board)\/([A-Za-z0-9_-]+)\/?([^/?]*)?/);
  if (!match) return null;

  const type = match[1] as FigmaUrlInfo["type"];
  const fileKey = match[2];
  const rawTitle = match[3];
  const title = rawTitle ? decodeURIComponent(rawTitle).replace(/-/g, " ").trim() || null : null;
  const rawNodeId = u.searchParams.get("node-id");
  const nodeId = rawNodeId ? rawNodeId.replace(/-/, ":") : null;

  return { fileKey, nodeId, type, title };
}

interface FigmaOEmbed {
  title?: string;
  thumbnail_url?: string;
  thumbnail_width?: number;
  thumbnail_height?: number;
}

export interface FigmaImage {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
}

/**
 * Fetches a visual for a public Figma URL using the oEmbed API.
 * Returns null if the file is private or the request fails —
 * the caller should fall back to text-only analysis.
 */
export async function fetchFigmaImage(info: FigmaUrlInfo, originalUrl: string): Promise<FigmaImage | null> {
  try {
    // Step 1: oEmbed metadata — works for any publicly shared file
    const oembedUrl = `https://www.figma.com/api/oembed?url=${encodeURIComponent(originalUrl)}`;
    const metaRes = await fetch(oembedUrl, {
      headers: { "User-Agent": "BrandSense/1.0" },
      signal: AbortSignal.timeout(10_000),
    });

    if (!metaRes.ok) return null;

    const meta = await metaRes.json() as FigmaOEmbed;
    if (!meta.thumbnail_url) return null;

    // Step 2: Download the thumbnail image
    const imgRes = await fetch(meta.thumbnail_url, {
      signal: AbortSignal.timeout(15_000),
    });
    if (!imgRes.ok) return null;

    const mimeType = (imgRes.headers.get("content-type") ?? "image/png").split(";")[0].trim();
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const fileName = `${meta.title ?? info.title ?? info.fileKey}.png`;

    return { buffer, mimeType, fileName };
  } catch {
    return null;
  }
}
