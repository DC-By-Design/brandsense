import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const session = await prisma.analysisSession.findFirst({
      where: { id, userId: user.id },
      select: {
        id: true, assetType: true, fileName: true, assetUrl: true,
        context: true, savedAt: true,
        guideline: { select: { id: true, label: true } },
        result: true,
      },
    });

    if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ session });
  } catch (err) {
    console.error("[GET /api/sessions/:id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const deleted = await prisma.analysisSession.deleteMany({
      where: { id, userId: user.id },
    });

    if (deleted.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[DELETE /api/sessions/:id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
