import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { validateImageFile } from "@/lib/utils/validation";
import { logger } from "@/lib/logger";

const CRAFT_BUCKET = "craft";
const MAX_IMAGES = 8;

/**
 * GET: List craft images (public - no auth required)
 */
export async function GET() {
  const supabase = await createClient();
  const { data: files, error } = await supabase.storage
    .from(CRAFT_BUCKET)
    .list("", { sortBy: { column: "created_at", order: "asc" } });

  if (error) {
    logger.error("Craft list error", { error: error.message });
    return NextResponse.json(
      { error: error.message || "Failed to list images" },
      { status: 500 }
    );
  }

  const images = (files || [])
    .filter((f) => f.name && !f.name.startsWith("."))
    .slice(0, MAX_IMAGES)
    .map((f) => {
      const { data } = supabase.storage
        .from(CRAFT_BUCKET)
        .getPublicUrl(f.name);
      return { path: f.name, url: data.publicUrl };
    });

  return NextResponse.json(images);
}

/**
 * POST: Upload craft image (admin only)
 */
export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    const validationError = await validateImageFile(file);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const supabase = await createClient();

    // Check current count
    const { data: existing } = await supabase.storage
      .from(CRAFT_BUCKET)
      .list("", { sortBy: { column: "created_at", order: "asc" } });
    const count = (existing || []).filter(
      (f) => f.name && !f.name.startsWith(".")
    ).length;
    if (count >= MAX_IMAGES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_IMAGES} images allowed. Delete one first.` },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `${timestamp}-${randomStr}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await supabase.storage
      .from(CRAFT_BUCKET)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      logger.error("Craft upload error", { error: error.message });
      return NextResponse.json(
        { error: error.message || "Upload failed" },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage
      .from(CRAFT_BUCKET)
      .getPublicUrl(data.path);

    return NextResponse.json({ url: urlData.publicUrl, path: data.path });
  } catch (err) {
    logger.error("Craft upload route error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
