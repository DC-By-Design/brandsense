import { NextResponse } from "next/server";
import { readdir } from "fs/promises";
import { join } from "path";

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

export async function GET() {
  try {
    const dir = join(process.cwd(), "public", "backgrounds");
    const files = await readdir(dir);
    const images = files
      .filter((f) => IMAGE_EXTS.has(f.slice(f.lastIndexOf(".")).toLowerCase()))
      .map((f) => `/backgrounds/${f}`);
    return NextResponse.json({ images });
  } catch {
    // Directory missing or unreadable — client falls back to Pexels
    return NextResponse.json({ images: [] });
  }
}
