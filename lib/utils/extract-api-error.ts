/**
 * Parse API error response into a user-friendly string.
 * Handles Zod validation errors (array), plain string, details array, or unknown shape.
 */
export function extractApiError(errorData: {
  error?: unknown;
  details?: unknown;
}): string {
  if (!errorData?.error && !errorData?.details) return "Something went wrong";

  const err = errorData.error;
  const details = errorData.details;

  if (Array.isArray(err)) {
    return err
      .map(
        (e: { path?: string[]; message?: string }) =>
          `${(e.path ?? []).join(".") || "field"}: ${e.message ?? "Invalid value"}`
      )
      .join(", ");
  }

  if (Array.isArray(details)) {
    return details
      .map(
        (d: { path?: string; message?: string }) =>
          `${d.path ?? "field"}: ${d.message ?? "Invalid value"}`
      )
      .join(", ");
  }

  if (typeof err === "string") return err;
  return "Something went wrong";
}
