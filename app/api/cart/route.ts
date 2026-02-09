import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const cartItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

// Supabase returns product/variant as arrays from join - normalize to single object
type CartItemRow = {
  product_id: string;
  variant_id: string;
  quantity: number;
  product: { name: string; slug: string; image_urls: string[] | null } | { name: string; slug: string; image_urls: string[] | null }[];
  variant: { name: string; slug: string; price: number; discount_percent: number; stock: number; is_active: boolean } | { name: string; slug: string; price: number; discount_percent: number; stock: number; is_active: boolean }[];
};

// GET /api/cart - Get user's cart items
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ items: [] }, { status: 200 });
  }

  // Fetch cart items with product and variant details
  const { data: cartItems, error } = await supabase
    .from("cart_items")
    .select(
      `
      id,
      product_id,
      variant_id,
      quantity,
      product:products!inner(
        id,
        name,
        slug,
        image_urls
      ),
      variant:product_variants!inner(
        id,
        name,
        slug,
        price,
        discount_percent,
        stock,
        is_active
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Transform to match CartItem type (Supabase may return product/variant as arrays)
  const items = (cartItems || []).map((item: CartItemRow) => {
    const product = Array.isArray(item.product) ? item.product[0] : item.product;
    const variant = Array.isArray(item.variant) ? item.variant[0] : item.variant;
    const imageUrls = (product?.image_urls as string[]) || [];
    return {
      productId: item.product_id,
      productName: product?.name ?? "",
      productSlug: product?.slug ?? "",
      variantId: item.variant_id,
      variantName: variant?.name ?? "",
      price: parseFloat(String(variant?.price ?? 0)),
      discountPercent: parseFloat(String(variant?.discount_percent ?? 0)),
      imageUrl: imageUrls[0] || null,
      quantity: item.quantity,
      stock: variant?.stock ?? 0,
      isActive: variant?.is_active ?? true,
    };
  });

  return NextResponse.json({ items });
}

// POST /api/cart - Add or update cart item
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { productId, variantId, quantity } = cartItemSchema.parse(body);

    // Check if item already exists
    const { data: existing } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .eq("variant_id", variantId)
      .single();

    if (existing) {
      // Update quantity
      const { error: updateError } = await supabase
        .from("cart_items")
        .update({ quantity: existing.quantity + quantity })
        .eq("id", existing.id);

      if (updateError) {
        throw updateError;
      }
    } else {
      // Insert new item
      const { error: insertError } = await supabase.from("cart_items").insert({
        user_id: user.id,
        product_id: productId,
        variant_id: variantId,
        quantity,
      });

      if (insertError) {
        throw insertError;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

// PUT /api/cart - Update cart item quantity
export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { productId, variantId, quantity } = cartItemSchema.parse(body);

    if (quantity <= 0) {
      // Delete item if quantity is 0 or less
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .eq("variant_id", variantId);

      if (error) throw error;
    } else {
      // Update quantity
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity })
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .eq("variant_id", variantId);

      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

// DELETE /api/cart - Remove cart item
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const variantId = searchParams.get("variantId");

    if (!productId || !variantId) {
      return NextResponse.json(
        { error: "productId and variantId are required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .eq("variant_id", variantId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
