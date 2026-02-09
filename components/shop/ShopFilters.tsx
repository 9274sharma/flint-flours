"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SUB_BRANDS, CATEGORIES, BRAND_TO_SUB_BRAND } from "@/lib/constants";

export function ShopFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Resolve sub-brand from either sub_brand or brand (from Our Brands links)
  const currentSubBrand =
    searchParams.get("sub_brand") ||
    BRAND_TO_SUB_BRAND[searchParams.get("brand") || ""] ||
    "";

  function updateFilter(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // When setting sub_brand, remove brand to keep URL clean
    if (key === "sub_brand") {
      params.delete("brand");
    }
    router.push(`/shop?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-stone-200 bg-white/80 px-6 py-4 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-stone-600">Sub-brand:</span>
        <select
          value={currentSubBrand}
          onChange={(e) => updateFilter("sub_brand", e.target.value || null)}
          aria-label="Filter by sub-brand"
          className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-800"
        >
          <option value="">All</option>
          {SUB_BRANDS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-stone-600">Category:</span>
        <select
          value={searchParams.get("category") ?? ""}
          onChange={(e) => updateFilter("category", e.target.value || null)}
          aria-label="Filter by category"
          className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-800"
        >
          <option value="">All</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-stone-600">Sort:</span>
        <select
          value={searchParams.get("sort") ?? "created_at"}
          onChange={(e) => {
            const params = new URLSearchParams(searchParams.toString());
            const val = e.target.value;
            params.set("sort", val);
            if (val === "price") {
              params.set("order", "asc");
            } else {
              params.delete("order");
            }
            router.push(`/shop?${params.toString()}`);
          }}
          aria-label="Sort products"
          className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-800"
        >
          <option value="created_at">Newest</option>
          <option value="name">Name A–Z</option>
        </select>
      </div>
    </div>
  );
}
