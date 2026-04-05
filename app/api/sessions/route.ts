import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessions = await prisma.analysisSession.findMany({
    where: { userId: user.id },
    orderBy: { savedAt: "desc" },
    take: 50,
    select: {
      id: true, assetType: true, fileName: true, assetUrl: true,
      savedAt: true,
      guideline: { select: { id: true, label: true } },
      result: true,
    },
  });

  const res = NextResponse.json({ sessions });
  res.headers.set("Cache-Control", "private, max-age=30, stale-while-revalidate=60");
  return res;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { assetType: string; fileName?: string; assetUrl?: string; context?: string; guidelineId?: string; result: unknown };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const session = await prisma.analysisSession.create({
    data: {
      userId: user.id,
      assetType: body.assetType,
      fileName: body.fileName ?? null,
      assetUrl: body.assetUrl ?? null,
      context: body.context ?? null,
      guidelineId: body.guidelineId ?? null,
      result: body.result as object,
    },
  });

  return NextResponse.json({ session }, { status: 201 });
}
