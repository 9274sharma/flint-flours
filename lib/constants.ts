export const SUB_BRANDS = ["Flint & Flours", "Milora"] as const;
export type SubBrand = (typeof SUB_BRANDS)[number];

export const CATEGORIES = [
  "Breads",
  "Cookies",
  "Cakes",
  "Snacks",
  "Savory",
  "Indian Sweets",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const BRAND_TO_SUB_BRAND: Record<string, string> = {
  "flint-flours": "Flint & Flours",
  milora: "Milora",
};
