import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/db";
import { extractBrandData } from "@/lib/analysis/brand-extract";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const guidelines = await prisma.brandGuideline.findMany({
      where: { OR: [{ userId: user.id }, { isPlatform: true }] },
      orderBy: [{ isPlatform: "desc" }, { createdAt: "desc" }],
      select: { id: true, label: true, description: true, fileName: true, fileSize: true, isPlatform: true, createdAt: true, brandData: true },
    });

    const res = NextResponse.json({ guidelines });
    res.headers.set("Cache-Control", "private, max-age=30, stale-while-revalidate=60");
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[GET /api/guidelines]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let formData: FormData;
    try { formData = await req.formData(); } catch {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const file = formData.get("file") as File | null;
    const label = formData.get("label") as string | null;
    const description = formData.get("description") as string | null;

    if (!file || !label?.trim()) {
      return NextResponse.json({ error: "File and label required" }, { status: 400 });
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files accepted" }, { status: 422 });
    }
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds 20MB limit" }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-z0-9.-]/gi, "_")}`;

    const adminClient = createAdminClient();
    // Upload to storage and run AI extraction in parallel
    const [uploadResult, extractResult] = await Promise.all([
      adminClient.storage
        .from("brand-guidelines")
        .upload(path, buffer, { contentType: "application/pdf" }),
      extractBrandData(buffer)
        .then((d) => JSON.parse(JSON.stringify(d)) as object)
        .catch((e) => { console.error("[brand-extract] failed:", e); return null; }),
    ]);

    if (uploadResult.error) {
      return NextResponse.json({ error: "Upload failed: " + uploadResult.error.message }, { status: 500 });
    }

    const { data: { publicUrl } } = adminClient.storage
      .from("brand-guidelines")
      .getPublicUrl(path);

    const brandData: object | null = extractResult;

    const guideline = await prisma.brandGuideline.create({
      data: {
        userId: user.id,
        label: label.trim(),
        description: description?.trim() || null,
        fileUrl: publicUrl,
        fileName: file.name,
        fileSize: file.size,
        ...(brandData ? { brandData } : {}),
      },
    });

    return NextResponse.json({ guideline }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[POST /api/guidelines]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
