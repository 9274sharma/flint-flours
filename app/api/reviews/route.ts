import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

// GET /api/reviews - Get reviews
// Query: productId (reviews for product), top (top N for dashboard)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  const top = parseInt(searchParams.get("top") || "0", 10);

  const supabase = await createClient();

  if (productId) {
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") || "4", 10)));

    const { data: allData, error } = await supabase
      .from("reviews")
      .select("id, rating, comment, created_at, reviewer_name")
      .contains("product_ids", [productId])
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching reviews", { error: error.message });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const all = allData || [];
    const total = all.length;
    const avgRating = total > 0 ? all.reduce((s, r) => s + r.rating, 0) / total : 0;
    const from = (page - 1) * limit;
    const to = from + limit;
    const paginated = all.slice(from, to);

    type ReviewRow = { reviewer_name?: string; [key: string]: unknown };
    const reviews = paginated.map((r: ReviewRow) => ({
      ...r,
      author: r.reviewer_name || "Customer",
    }));

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      avgRating,
    });
  }

  if (top > 0) {
    const { data, error } = await supabase
      .from("reviews")
      .select("id, rating, comment, created_at, product_ids, reviewer_name")
      .order("created_at", { ascending: false })
      .limit(Math.min(top, 10));

    if (error) {
      logger.error("Error fetching top reviews", { error: error.message });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    type ReviewRow = { id: string; rating: number; comment: string | null; created_at: string; reviewer_name?: string };
    const withAuthor = (data || []).map((r: ReviewRow) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      author: r.reviewer_name || "Customer",
    }));

    return NextResponse.json(withAuthor);
  }

  return NextResponse.json({ error: "Provide productId or top" }, { status: 400 });
}
