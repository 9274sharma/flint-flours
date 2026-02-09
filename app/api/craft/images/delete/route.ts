import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";

const CRAFT_BUCKET = "craft";

/**
 * DELETE: Remove craft image from storage (admin only)
 * Body: { path: string }
 */
export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const path = typeof body.path === "string" ? body.path.trim() : null;

    if (!path) {
      return NextResponse.json(
        { error: "Path is required" },
        { status: 400 }
      );
    }

    // Prevent path traversal
    if (path.includes("..") || path.startsWith("/")) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase.storage
      .from(CRAFT_BUCKET)
      .remove([path]);

    if (error) {
      logger.error("Craft delete error", { error: error.message });
      return NextResponse.json(
        { error: error.message || "Delete failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("Craft delete route error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Delete failed" },
      { status: 500 }
    );
  }
}
