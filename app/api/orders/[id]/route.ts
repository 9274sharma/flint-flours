import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/logger";

const PAYMENT_STATUSES = ["paid", "pending", "refunded", "failed", "cancelled"] as const;
const ORDER_STATUSES = ["placed", "shipped", "delivered"] as const;

// PATCH /api/orders/[id] - Update order status (admin only)
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Order ID required" }, { status: 400 });
  }

  let body: { status?: string; order_status?: string };
  try {
    body = await _request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updates: { status?: string; order_status?: string } = {};
  if (body.status != null && (PAYMENT_STATUSES as readonly string[]).includes(body.status)) {
    updates.status = body.status;
  }
  if (body.order_status != null && (ORDER_STATUSES as readonly string[]).includes(body.order_status)) {
    updates.order_status = body.order_status;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", id)
    .select("id, status, order_status")
    .single();

  if (error) {
    logger.error("Error updating order", { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
