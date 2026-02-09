import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/logger";

const PAGE_SIZE = 10;
const PAYMENT_STATUSES = ["paid", "pending", "refunded", "failed", "cancelled"] as const;
const ORDER_STATUSES = ["placed", "shipped", "delivered"] as const;

// GET /api/orders - List all orders (admin only)
// Query: page, limit, dateFilter (today|week|month|all), status, order_status
export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || String(PAGE_SIZE), 10)));
  const dateFilter = searchParams.get("dateFilter") || "all";
  const status = searchParams.get("status") || "";
  const orderStatus = searchParams.get("order_status") || "";
  const orderId = (searchParams.get("orderId") || "").trim();

  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select(
      `
      id,
      user_id,
      status,
      order_status,
      total,
      created_at,
      address:addresses (
        line1,
        city,
        state,
        pincode,
        phone
      ),
      order_items (
        quantity,
        price_at_order,
        product:products (name, slug, image_urls),
        variant:product_variants (name, slug)
      )
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  // Date filter
  if (dateFilter === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    query = query.gte("created_at", start.toISOString()).lte("created_at", end.toISOString());
  } else if (dateFilter === "week") {
    const start = new Date();
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    query = query.gte("created_at", start.toISOString());
  } else if (dateFilter === "month") {
    const start = new Date();
    start.setMonth(start.getMonth() - 1);
    start.setHours(0, 0, 0, 0);
    query = query.gte("created_at", start.toISOString());
  }

  if (status && (PAYMENT_STATUSES as readonly string[]).includes(status)) {
    query = query.eq("status", status);
  }
  if (orderStatus && (ORDER_STATUSES as readonly string[]).includes(orderStatus)) {
    query = query.eq("order_status", orderStatus);
  }

  if (orderId) {
    const fullUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    if (fullUuid) {
      query = query.eq("id", orderId);
    } else {
      query = query.ilike("id_search", `%${orderId}%`);
    }
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const { data: orders, error, count } = await query.range(from, to);

  if (error) {
    logger.error("Error fetching orders", { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    orders: orders || [],
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  });
}
