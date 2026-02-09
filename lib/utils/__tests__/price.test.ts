import { describe, it, expect } from "vitest";
import { getFinalPrice } from "../price";

describe("getFinalPrice", () => {
  it("returns full price when discount is 0", () => {
    expect(getFinalPrice(100, 0)).toBe(100);
  });

  it("applies discount correctly", () => {
    expect(getFinalPrice(100, 10)).toBe(90);
    expect(getFinalPrice(200, 25)).toBe(150);
  });

  it("handles 100% discount", () => {
    expect(getFinalPrice(100, 100)).toBe(0);
  });
});
