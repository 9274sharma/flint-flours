import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

// POST /api/orders/verify - Verify Razorpay payment
export async function POST(request: NextRequest) {
  const id = getClientIdentifier(request);
  const { allowed } = checkRateLimit(id, { limit: 20, windowSeconds: 60 });
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json(
      { error: "Razorpay secret not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_id) {
      return NextResponse.json(
        { error: "Missing required payment verification fields" },
        { status: 400 }
      );
    }

    // Verify order belongs to user
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, razorpay_order_id, status")
      .eq("id", order_id)
      .eq("user_id", user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.razorpay_order_id !== razorpay_order_id) {
      return NextResponse.json(
        { error: "Razorpay order ID mismatch" },
        { status: 400 }
      );
    }

    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Update order status and payment ID
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "paid",
        razorpay_payment_id: razorpay_payment_id,
      })
      .eq("id", order_id);

    if (updateError) {
      logger.error("Error updating order", { error: updateError.message });
      return NextResponse.json(
        { error: "Failed to update order status" },
        { status: 500 }
      );
    }

    // Get order items to update stock
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select("variant_id, quantity")
      .eq("order_id", order_id);

    if (!itemsError && orderItems) {
      // Update stock for each variant using the RPC function
      for (const item of orderItems) {
        if (item.variant_id) {
          const { error: stockError } = await supabase.rpc("decrement_variant_stock", {
            variant_id: item.variant_id,
            quantity: item.quantity,
          });

          if (stockError) {
            logger.error("Error updating stock for variant", {
              variantId: item.variant_id,
              error: stockError.message,
            });
            // Try fallback method if RPC doesn't exist yet
            const { data: variant } = await supabase
              .from("product_variants")
              .select("stock, name")
              .eq("id", item.variant_id)
              .single();

            if (variant) {
              const currentStock = variant.stock ?? 0;
              const newStock = Math.max(0, currentStock - item.quantity);
              
              if (currentStock < item.quantity) {
                logger.warn("Insufficient stock during payment verify", {
                  variantName: variant.name,
                  variantId: item.variant_id,
                  available: currentStock,
                  required: item.quantity,
                });
              }

              const { error: stockUpdateErr } = await supabase
                .from("product_variants")
                .update({ stock: newStock })
                .eq("id", item.variant_id);

              if (stockUpdateErr) {
                logger.error("Fallback stock update failed", {
                  variantId: item.variant_id,
                  error: stockUpdateErr.message,
                });
              }
            }
          }
        }
      }
    }

    // Clear cart items for this user
    const { error: cartError } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", user.id);

    if (cartError) {
      logger.error("Error clearing cart after payment", { error: cartError.message });
    }

    return NextResponse.json({ success: true, orderId: order_id });
  } catch (error: unknown) {
    logger.error("Error verifying payment", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to verify payment",
      },
      { status: 500 }
    );
  }
}
