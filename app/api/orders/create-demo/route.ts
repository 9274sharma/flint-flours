import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { createOrderSchema } from "@/lib/schemas/order";
import { apiError, zodErrorResponse } from "@/lib/api-errors";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";

// POST /api/orders/create-demo - Create a demo order (bypasses payment)
export async function POST(request: NextRequest) {
  const id = getClientIdentifier(request);
  const { allowed } = checkRateLimit(id, { limit: 10, windowSeconds: 60 });
  if (!allowed) {
    return apiError("Too many requests", 429);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return apiError("Unauthorized", 401);
  }

  try {
    const body = await request.json();
    const parsed = createOrderSchema.parse(body);

    // Verify address belongs to user
    const { data: address, error: addressError } = await supabase
      .from("addresses")
      .select("id")
      .eq("id", parsed.addressId)
      .eq("user_id", user.id)
      .single();

    if (addressError || !address) {
      return apiError("Address not found or does not belong to user", 404);
    }

    // Verify stock availability and calculate total
    for (const item of parsed.items) {
      const { data: variant, error: variantError } = await supabase
        .from("product_variants")
        .select("stock, name")
        .eq("id", item.variantId)
        .single();

      if (variantError || !variant) {
        return apiError(`Variant not found: ${item.variantId}`, 404);
      }

      if (variant.stock < item.quantity) {
        return apiError(
          `Insufficient stock for ${variant.name}. Available: ${variant.stock}, Requested: ${item.quantity}`,
          400
        );
      }
    }

    // Calculate total
    const total = parsed.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Create order with "paid" status (demo order)
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        address_id: parsed.addressId,
        total: total,
        status: "paid",
        razorpay_order_id: "demo_order_" + Date.now(),
        razorpay_payment_id: "demo_payment_" + Date.now(),
      })
      .select()
      .single();

    if (orderError) {
      return apiError(orderError.message, 500);
    }

    // Create order items
    const orderItems = parsed.items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      variant_id: item.variantId,
      quantity: item.quantity,
      price_at_order: item.price,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      await supabase.from("orders").delete().eq("id", order.id);
      return apiError("Failed to create order items", 500);
    }

    // Update stock for each variant (decrement by quantity ordered)
    // Since this is a demo order with "paid" status, update stock immediately
    for (const item of parsed.items) {
      const { error: stockError } = await supabase.rpc("decrement_variant_stock", {
        variant_id: item.variantId,
        quantity: item.quantity,
      });

      if (stockError) {
        // Don't fail the order, but log the error
        // Try fallback method if RPC doesn't exist yet
        const { data: currentVariant } = await supabase
          .from("product_variants")
          .select("stock")
          .eq("id", item.variantId)
          .single();

        if (currentVariant) {
          const newStock = Math.max(0, currentVariant.stock - item.quantity);
          await supabase
            .from("product_variants")
            .update({ stock: newStock })
            .eq("id", item.variantId);
        }
      }
    }

    // Clear cart items for this user
    const { error: cartError } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", user.id);

    if (cartError) {
      // Don't fail the request; cart will sync on next load
    }

    return NextResponse.json({ order }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return zodErrorResponse(error);
    }
    return apiError(
      error instanceof Error ? error.message : "Failed to create demo order",
      500
    );
  }
}
