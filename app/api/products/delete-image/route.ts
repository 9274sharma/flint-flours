import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/logger";

/**
 * Delete an image from Supabase Storage
 * Accepts JSON body with { filePath: string }
 */
export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { filePath } = body;

    if (!filePath || typeof filePath !== "string") {
      return NextResponse.json(
        { error: "filePath is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase.storage
      .from("products")
      .remove([filePath]);

    if (error) {
      if (error.message?.includes("not found") || error.message?.includes("does not exist")) {
        return NextResponse.json({ success: true, message: "File already deleted or not found" });
      }
      logger.error("Storage delete error", { filePath, error: error.message });
      return NextResponse.json(
        { error: error.message || "Failed to delete image" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Delete image route error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete image",
      },
      { status: 500 }
    );
  }
}
