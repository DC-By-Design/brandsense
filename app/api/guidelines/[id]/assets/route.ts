import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/db";

const ACCEPTED = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"]);
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const guideline = await prisma.brandGuideline.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!guideline) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const assetKey = formData.get("assetKey") as string | null;

    if (!file || !assetKey) return NextResponse.json({ error: "file and assetKey required" }, { status: 400 });
    if (!ACCEPTED.has(file.type)) return NextResponse.json({ error: "Unsupported file type" }, { status: 422 });
    if (file.size > MAX_SIZE) return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 413 });

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const storagePath = `${user.id}/${id}/assets/${assetKey}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const adminClient = createAdminClient();
    const { error: uploadErr } = await adminClient.storage
      .from("brand-guidelines")
      .upload(storagePath, buffer, { contentType: file.type, upsert: true });

    if (uploadErr) return NextResponse.json({ error: "Upload failed: " + uploadErr.message }, { status: 500 });

    const { data: { publicUrl } } = adminClient.storage
      .from("brand-guidelines")
      .getPublicUrl(storagePath);

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error("[POST /api/guidelines/:id/assets]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
