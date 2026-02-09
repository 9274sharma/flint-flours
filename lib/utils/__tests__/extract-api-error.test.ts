import { describe, it, expect } from "vitest";
import { extractApiError } from "../extract-api-error";

describe("extractApiError", () => {
  it("returns string error", () => {
    expect(extractApiError({ error: "Something went wrong" })).toBe("Something went wrong");
  });

  it("handles Zod-style array errors", () => {
    const errorData = {
      error: [
        { path: ["addressId"], message: "Invalid UUID" },
        { path: ["items", "0", "quantity"], message: "Must be positive" },
      ],
    };
    expect(extractApiError(errorData)).toBe("addressId: Invalid UUID, items.0.quantity: Must be positive");
  });

  it("handles details array", () => {
    const errorData = {
      error: "Validation failed",
      details: [
        { path: "line1", message: "Required" },
        { path: "pincode", message: "Must be 6 digits" },
      ],
    };
    expect(extractApiError(errorData)).toBe("line1: Required, pincode: Must be 6 digits");
  });

  it("returns fallback for empty/missing", () => {
    expect(extractApiError({})).toBe("Something went wrong");
    expect(extractApiError({ error: null })).toBe("Something went wrong");
  });
});
