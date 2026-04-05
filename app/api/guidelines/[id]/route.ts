import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/db";
import type { BrandDataHistoryEntry } from "@/lib/analysis/brand-extract";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const guideline = await prisma.brandGuideline.findFirst({
      where: { id, OR: [{ userId: user.id }, { isPlatform: true }] },
      select: { id: true, label: true, description: true, fileName: true, fileSize: true, isPlatform: true, createdAt: true, brandData: true },
    });

    if (!guideline) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ guideline });
  } catch (err) {
    console.error("[GET /api/guidelines/:id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const guideline = await prisma.brandGuideline.findFirst({
      where: { id, userId: user.id, isPlatform: false },
    });

    if (!guideline) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const url = new URL(guideline.fileUrl);
    const path = url.pathname.split("/brand-guidelines/")[1];
    if (path) {
      await createAdminClient().storage.from("brand-guidelines").remove([path]);
    }

    await prisma.brandGuideline.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/guidelines/:id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const guideline = await prisma.brandGuideline.findFirst({
      where: { id, userId: user.id },
      select: { brandData: true },
    });
    if (!guideline) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json() as {
      brandData: Record<string, unknown>;
      historyEntries?: Array<{ field: string; prev: string; next: string }>;
    };

    const existing = (guideline.brandData ?? {}) as Record<string, unknown>;
    const prevHistory = (Array.isArray(existing._history) ? existing._history : []) as BrandDataHistoryEntry[];

    const newEntries: BrandDataHistoryEntry[] = (body.historyEntries ?? []).map((e) => ({
      field: e.field,
      prev: e.prev,
      next: e.next,
      updatedAt: new Date().toISOString(),
    }));

    const merged = {
      ...existing,
      ...body.brandData,
      _history: [...prevHistory, ...newEntries],
    };

    const updated = await prisma.brandGuideline.update({
      where: { id },
      data: { brandData: JSON.parse(JSON.stringify(merged)) },
      select: { id: true, brandData: true },
    });

    return NextResponse.json({ guideline: updated });
  } catch (err) {
    console.error("[PATCH /api/guidelines/:id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
