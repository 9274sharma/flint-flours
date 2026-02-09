"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { SUB_BRANDS, CATEGORIES } from "@/lib/constants";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debouncedValue;
}

type Product = {
  id: string;
  name: string;
  slug: string;
  category: string;
  sub_brand: string;
  is_active: boolean;
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subBrand, setSubBrand] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("include_inactive", "true");
      if (subBrand) params.set("sub_brand", subBrand);
      if (category) params.set("category", category);
      if (status) params.set("status", status);
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());

      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 401) {
          setError("Please sign in as admin.");
          return;
        }
        throw new Error("Failed to fetch");
      }
      const data = await res.json();
      setProducts(data);
    } catch {
      setError("Failed to load products.");
    } finally {
      setLoading(false);
    }
  }, [subBrand, category, status, debouncedSearch]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div>
      {loading && (
        <p className="mb-4 text-gray-600">Loading...</p>
      )}
      {error && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
          {error}
          <button
            type="button"
            onClick={() => fetchProducts()}
            className="ml-4 text-sm font-medium underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <Link
          href="/admin/products/new"
          className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-900"
        >
          Add product
        </Link>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex flex-1 min-w-[200px] items-center gap-2">
          <label htmlFor="search" className="text-sm font-medium text-gray-700">
            Search
          </label>
          <input
            id="search"
            type="text"
            placeholder="Name, slug, or product ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="sub-brand" className="text-sm font-medium text-gray-700">
            Sub-brand
          </label>
          <select
            id="sub-brand"
            value={subBrand}
            onChange={(e) => setSubBrand(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
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
          <label htmlFor="category" className="text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
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
          <label htmlFor="status" className="text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <p className="text-gray-700">
            {loading
              ? "Loading..."
              : error
                ? "No products to display."
                : subBrand || category || status || debouncedSearch
                  ? "No products match your filters."
                  : "No products yet. Add your first product."}
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-700">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-700">
                  Slug
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-700">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-700">
                  Sub-brand
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-700">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-700">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-3 text-xs font-mono text-gray-500">
                    {product.id}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">
                    {product.slug}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {product.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {product.sub_brand}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {product.category}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        product.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {product.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="inline-flex items-center justify-center rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
                      aria-label="Edit product"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
