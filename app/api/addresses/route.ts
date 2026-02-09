import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";
import { addressSchema } from "@/lib/schemas/address";
import { logger } from "@/lib/logger";

// GET /api/addresses - Get user's addresses
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: addresses, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("Error fetching addresses", { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ addresses: addresses || [] });
}

// POST /api/addresses - Create a new address
export async function POST(request: NextRequest) {
  const clientId = getClientIdentifier(request);
  const { allowed } = checkRateLimit(clientId, { limit: 20, windowSeconds: 60 });
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

  try {
    const body = await request.json();
    const parsed = addressSchema.parse(body);

    const { data: address, error } = await supabase
      .from("addresses")
      .insert({
        user_id: user.id,
        ...parsed,
      })
      .select()
      .single();

    if (error) {
      logger.error("Error creating address", { error: error.message });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ address }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to create address";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/addresses - Update an existing address
export async function PUT(request: NextRequest) {
  const clientId = getClientIdentifier(request);
  const { allowed } = checkRateLimit(clientId, { limit: 20, windowSeconds: 60 });
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

  try {
    const body = await request.json();
    const { id, ...addressData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Address ID is required" },
        { status: 400 }
      );
    }

    // Verify address belongs to user
    const { data: existingAddress, error: checkError } = await supabase
      .from("addresses")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (checkError || !existingAddress) {
      return NextResponse.json(
        { error: "Address not found or does not belong to user" },
        { status: 404 }
      );
    }

    // Validate address data
    const parsed = addressSchema.parse(addressData);

    // Update address
    const { data: address, error } = await supabase
      .from("addresses")
      .update(parsed)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      logger.error("Error updating address", { error: error.message });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ address });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to update address";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
