import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Razorpay from "razorpay";
import { logger } from "@/lib/logger";

// POST /api/orders/razorpay - Create Razorpay order
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json(
      { error: "Razorpay credentials not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { orderId, amount } = body;

    if (!orderId || !amount) {
      return NextResponse.json(
        { error: "Order ID and amount are required" },
        { status: 400 }
      );
    }

    // Verify order belongs to user
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, total, status")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.status !== "pending") {
      return NextResponse.json(
        { error: "Order is not in pending status" },
        { status: 400 }
      );
    }

    // Create Razorpay order (lazy init to avoid build-time errors when env vars missing)
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency: "INR",
      receipt: order.id,
      notes: {
        order_id: order.id,
        user_id: user.id,
      },
    });

    // Update order with Razorpay order ID
    const { error: updateError } = await supabase
      .from("orders")
      .update({ razorpay_order_id: razorpayOrder.id })
      .eq("id", order.id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to link payment to order" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error: unknown) {
    logger.error("Error creating Razorpay order", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create Razorpay order",
      },
      { status: 500 }
    );
  }
}
