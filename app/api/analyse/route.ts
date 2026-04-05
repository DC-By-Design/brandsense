import { NextRequest } from "next/server";
import { runPipeline, type PipelineInput } from "@/lib/analysis/pipeline";
import { detectAssetType, MAX_FILE_SIZE_BYTES } from "@/lib/schemas/upload";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { randomUUID } from "crypto";
import type { BrandData } from "@/lib/analysis/brand-extract";

const encoder = new TextEncoder();

function send(controller: ReadableStreamDefaultController, obj: unknown) {
  controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
}

async function handleRequest(
  req: NextRequest,
  controller: ReadableStreamDefaultController
) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    send(controller, { type: "error", message: "Invalid form data" });
    return;
  }

  send(controller, { type: "progress", step: "reading", value: 10 });

  const file = formData.get("file") as File | null;
  const urlInput = formData.get("url") as string | null;
  const brandFile = formData.get("brandGuideline") as File | null;
  const guidelineId = (formData.get("guidelineId") as string | null) || undefined;
  const context = (formData.get("context") as string | null) || undefined;

  if (!file && !urlInput) {
    send(controller, { type: "error", message: "No file or URL provided" });
    return;
  }

  if (file && file.size > MAX_FILE_SIZE_BYTES) {
    send(controller, { type: "error", message: "File exceeds 50 MB limit" });
    return;
  }

  let brandBuffer: Buffer | undefined = brandFile
    ? Buffer.from(await brandFile.arrayBuffer())
    : undefined;

  let brandData: BrandData | undefined;

  // If a saved guideline ID was provided, fetch structured brand data + PDF
  if (guidelineId) {
    const guideline = await prisma.brandGuideline.findFirst({
      where: { id: guidelineId },
      select: { fileUrl: true, brandData: true },
    });
    if (guideline) {
      // Use structured brand data for precise rule-checking
      if (guideline.brandData) {
        brandData = guideline.brandData as unknown as BrandData;
      }
      // Also fetch PDF buffer as a fallback visual reference
      if (!brandBuffer) {
        try {
          const res = await fetch(guideline.fileUrl);
          if (res.ok) brandBuffer = Buffer.from(await res.arrayBuffer());
        } catch { /* non-fatal */ }
      }
    }
  }

  send(controller, { type: "progress", step: "detecting", value: 20 });

  let input: PipelineInput;

  if (urlInput) {
    input = { type: "url", url: urlInput, brandGuideline: brandBuffer, context };
  } else if (file) {
    const assetType = detectAssetType(file.type);
    if (!assetType) {
      send(controller, { type: "error", message: `Unsupported file type: ${file.type}` });
      return;
    }

    send(controller, { type: "progress", step: "uploading", value: 35 });
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    if (assetType === "image") {
      input = { type: "image", buffer: fileBuffer, mimeType: file.type, fileName: file.name, brandGuideline: brandBuffer, brandData, context };
    } else if (assetType === "pdf") {
      input = { type: "pdf", buffer: fileBuffer, fileName: file.name, brandGuideline: brandBuffer, brandData, context };
    } else {
      input = { type: "video", buffer: fileBuffer, fileName: file.name, brandGuideline: brandBuffer, brandData, context };
    }
  } else {
    send(controller, { type: "error", message: "No input" });
    return;
  }

  send(controller, { type: "progress", step: "analysing", value: 50 });

  const result = await runPipeline(input);

  send(controller, { type: "progress", step: "building", value: 95 });

  // Upload image/pdf assets to storage so saved reviews can show a preview
  if (file && (input.type === "image" || input.type === "pdf")) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const storagePath = `${user.id}/reviews/${randomUUID()}.${ext}`;
        const fileBuffer = input.type === "image"
          ? (input as { buffer: Buffer }).buffer
          : (input as { buffer: Buffer }).buffer;
        const adminClient = createAdminClient();
        const { error: uploadErr } = await adminClient.storage
          .from("brand-guidelines")
          .upload(storagePath, fileBuffer, { contentType: file.type, upsert: false });
        if (!uploadErr) {
          const { data: { publicUrl } } = adminClient.storage
            .from("brand-guidelines")
            .getPublicUrl(storagePath);
          send(controller, { type: "asset_stored", url: publicUrl });
        }
      }
    } catch { /* non-fatal — preview just won't be available */ }
  }

  send(controller, { type: "result", data: result });
}

export async function POST(req: NextRequest) {
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        await handleRequest(req, controller);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Analysis failed";
        try {
          send(controller, { type: "error", message });
        } catch {
          // stream already in bad state
        }
      } finally {
        try {
          controller.close();
        } catch {
          // already closed
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
