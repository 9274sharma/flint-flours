import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

// POST /api/reviews/create - Create or update review (one per order, applies to all products)
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { order_id: string; rating: number; comment?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { order_id, rating, comment = "" } = body;

  if (!order_id || !rating || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "order_id and rating (1-5) required" },
      { status: 400 }
    );
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, user_id")
    .eq("id", order_id)
    .eq("user_id", user.id)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const { data: orderItems } = await supabase
    .from("order_items")
    .select("product_id")
    .eq("order_id", order_id);

  const productIds = Array.from(new Set((orderItems || []).map((i) => i.product_id)));

  if (productIds.length === 0) {
    return NextResponse.json(
      { error: "Order has no items" },
      { status: 400 }
    );
  }

  const reviewerName =
    (user.user_metadata?.full_name as string) ??
    (user.user_metadata?.name as string) ??
    user.email?.split("@")[0] ??
    "Customer";

  const reviewData = {
    user_id: user.id,
    order_id,
    product_ids: productIds,
    rating,
    comment: comment?.trim() || null,
    reviewer_name: reviewerName,
  };

  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("user_id", user.id)
    .eq("order_id", order_id)
    .single();

  let result;
  if (existing) {
    const { data, error } = await supabase
      .from("reviews")
      .update({
        rating,
        comment: reviewData.comment,
        product_ids: productIds,
        reviewer_name: reviewerName,
      })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) {
      logger.error("Error updating review", { error: error.message });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    result = data;
  } else {
    const { data, error } = await supabase
      .from("reviews")
      .insert(reviewData)
      .select()
      .single();
    if (error) {
      logger.error("Error creating review", { error: error.message });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    result = data;
  }

  return NextResponse.json(result);
}
