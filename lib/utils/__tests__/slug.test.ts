import { describe, it, expect } from "vitest";
import { generateProductSlug, generateVariantSlug } from "../slug";

describe("generateProductSlug", () => {
  it("converts to uppercase with underscores", () => {
    expect(generateProductSlug("Sourdough Rustic")).toBe("SOURDOUGH_RUSTIC");
  });

  it("removes special characters", () => {
    expect(generateProductSlug("Hello! @World#")).toBe("HELLO_WORLD");
  });

  it("handles empty string", () => {
    expect(generateProductSlug("")).toBe("");
  });
});

describe("generateVariantSlug", () => {
  it("converts to lowercase with hyphens", () => {
    expect(generateVariantSlug("Jalapeno Cheese")).toBe("jalapeno-cheese");
  });

  it("removes special characters", () => {
    expect(generateVariantSlug("Plain!")).toBe("plain");
  });

  it("handles empty string", () => {
    expect(generateVariantSlug("")).toBe("");
  });
});
