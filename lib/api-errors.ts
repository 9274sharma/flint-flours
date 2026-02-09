import { NextResponse } from "next/server";
import type { ZodError } from "zod";

/**
 * Standard API error response format.
 * Use consistently across all API routes for predictable error handling.
 */
export function apiError(
  message: string,
  status: number,
  details?: unknown
): NextResponse {
  const body: { error: string; details?: unknown } = { error: message };
  if (details !== undefined && details !== null) {
    body.details = details;
  }
  return NextResponse.json(body, { status });
}

/**
 * Handle Zod validation errors - returns format compatible with frontend error parsing.
 */
export function zodErrorResponse(error: ZodError): NextResponse {
  return NextResponse.json({ error: error.errors }, { status: 400 });
}
