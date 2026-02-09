"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { Header } from "@/components/landing/Header";
import { getFinalPrice } from "@/lib/utils/price";

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, getTotalItems, refreshCart, isLoading } = useCart();
  const [isRefreshing, setIsRefreshing] = useState(true);
  const totalItems = getTotalItems();

  // Fetch fresh cart data from backend every time we visit the cart page
  useEffect(() => {
    let cancelled = false;

    async function loadCart() {
      setIsRefreshing(true);
      try {
        await refreshCart();
      } finally {
        if (!cancelled) {
          setIsRefreshing(false);
        }
      }
    }

    if (!isLoading) {
      loadCart();
    } else {
      setIsRefreshing(false);
    }

    return () => {
      cancelled = true;
    };
  }, [refreshCart, isLoading]);

  // Filter items by stock status (items from API include stock and isActive)
  const inStockItems = items.filter((item) => {
    const currentStock = item.stock ?? 0;
    const isActive = item.isActive ?? true;
    return currentStock > 0 && isActive;
  });

  const outOfStockItems = items.filter((item) => {
    const currentStock = item.stock ?? 0;
    const isActive = item.isActive ?? true;
    return currentStock <= 0 || !isActive;
  });

  // Calculate totals - only include in-stock items
  const subtotal = inStockItems.reduce((sum, item) => {
    const finalPrice = getFinalPrice(item.price, item.discountPercent);
    return sum + finalPrice * item.quantity;
  }, 0);

  const inStockItemCount = inStockItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleQuantityChange = (productId: string, variantId: string, delta: number) => {
    const item = items.find(
      (i) => i.productId === productId && i.variantId === variantId
    );
    if (item) {
      const newQuantity = item.quantity + delta;
      updateQuantity(productId, variantId, newQuantity);
    }
  };

  if (isLoading || isRefreshing) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-cream-50 to-cream-100">
        <Header />
        <div className="mx-auto max-w-7xl px-4 py-12">
          <h1 className="font-serif text-3xl font-bold text-stone-850">Cart</h1>
          <div className="mt-12 rounded-xl border border-stone-200 bg-white/80 p-12 text-center">
            <p className="text-stone-600">Loading cart...</p>
          </div>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-cream-50 to-cream-100">
        <Header />
        <div className="mx-auto max-w-7xl px-4 py-12">
          <h1 className="font-serif text-3xl font-bold text-stone-850">Cart</h1>
          <div className="mt-12 rounded-xl border border-stone-200 bg-white/80 p-12 text-center">
            <svg
              className="mx-auto h-16 w-16 text-stone-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <p className="mt-4 text-lg font-medium text-stone-900">Your cart is empty</p>
            <p className="mt-2 text-stone-600">
              Start adding items to your cart to see them here.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-block rounded-lg bg-stone-850 px-6 py-3 text-sm font-medium text-white transition hover:bg-stone-900"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-cream-50 to-cream-100">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="font-serif text-3xl font-bold text-stone-850">Cart</h1>
        <p className="mt-2 text-stone-600">
          {totalItems} {totalItems === 1 ? "item" : "items"} in your cart
          {outOfStockItems.length > 0 && (
            <span className="ml-2 text-amber-600">
              ({outOfStockItems.length} out of stock)
            </span>
          )}
        </p>
        {outOfStockItems.length > 0 && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-900">
              ⚠️ {outOfStockItems.length} {outOfStockItems.length === 1 ? "item is" : "items are"} out of stock and will not be included in checkout.
            </p>
          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {items.map((item) => {
                const finalPrice = getFinalPrice(item.price, item.discountPercent);
                const itemTotal = finalPrice * item.quantity;
                const hasDiscount = item.discountPercent > 0;
                const currentStock = item.stock ?? 0;
                const isActive = item.isActive ?? true;
                const isOutOfStock = currentStock <= 0 || !isActive;

                return (
                  <div
                    key={`${item.productId}-${item.variantId}`}
                    className={`flex gap-4 rounded-xl border p-4 shadow-sm ${
                      isOutOfStock
                        ? "border-amber-300 bg-amber-50/50"
                        : "border-stone-200 bg-white"
                    }`}
                  >
                    {/* Product Image */}
                    <Link
                      href={`/shop/${item.productSlug}`}
                      className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-cream-100"
                    >
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.productName}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-stone-400">
                          <span className="text-xs">No image</span>
                        </div>
                      )}
                    </Link>

                    {/* Product Details */}
                    <div className="flex flex-1 flex-col">
                      <div className="flex flex-1 justify-between">
                        <div className="flex-1">
                          <div className="flex items-start gap-2">
                            <Link
                              href={`/shop/${item.productSlug}`}
                              className="font-serif font-semibold text-stone-900 hover:text-stone-700"
                            >
                              {item.productName}
                            </Link>
                            {isOutOfStock && (
                              <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-medium text-white">
                                Out of Stock
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-sm text-stone-600">
                            Variant: {item.variantName}
                          </p>
                          {isOutOfStock && (
                            <p className="mt-1 text-xs text-amber-700">
                              This item is no longer available. Please remove it from your cart.
                            </p>
                          )}

                          {/* Price */}
                          <div className="mt-2 flex items-baseline gap-2">
                            <span className="font-semibold text-stone-900">
                              ₹{finalPrice.toLocaleString("en-IN", {
                                maximumFractionDigits: 2,
                              })}
                            </span>
                            {hasDiscount && (
                              <>
                                <span className="text-sm text-stone-500 line-through">
                                  ₹{item.price.toLocaleString("en-IN", {
                                    maximumFractionDigits: 2,
                                  })}
                                </span>
                                <span className="text-xs font-medium text-green-600">
                                  {item.discountPercent}% off
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeItem(item.productId, item.variantId)}
                          className="ml-4 flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
                          aria-label="Remove item"
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
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>

                      {/* Quantity Controls and Total */}
                      <div className="mt-4 flex items-center justify-between">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleQuantityChange(item.productId, item.variantId, -1)
                            }
                            disabled={isOutOfStock}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-300 bg-white text-stone-700 transition hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Decrease quantity"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M20 12H4"
                              />
                            </svg>
                          </button>
                          <span className="min-w-[2rem] text-center text-sm font-medium text-stone-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              handleQuantityChange(item.productId, item.variantId, 1)
                            }
                            disabled={isOutOfStock || item.quantity >= currentStock}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-300 bg-white text-stone-700 transition hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Increase quantity"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                          </button>
                        </div>

                        {/* Item Total */}
                        <div className="text-right">
                          <p className="text-sm text-stone-600">Item total</p>
                          <p className="font-semibold text-stone-900">
                            ₹{itemTotal.toLocaleString("en-IN", {
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
              <h2 className="font-serif text-xl font-semibold text-stone-900">
                Order Summary
              </h2>

              <div className="mt-6 space-y-3">
                <div className="flex justify-between text-sm text-stone-600">
                  <span>
                    Subtotal ({inStockItemCount} {inStockItemCount === 1 ? "item" : "items"})
                  </span>
                  <span className="font-medium text-stone-900">
                    ₹{subtotal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="border-t border-stone-200 pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-stone-900">Total</span>
                    <span className="font-serif text-xl font-bold text-stone-900">
                      ₹{subtotal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              <button
                className="mt-6 w-full rounded-lg bg-stone-850 px-6 py-3 text-sm font-medium text-white transition hover:bg-stone-900 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={inStockItems.length === 0}
                onClick={() => {
                  // Navigate to checkout page
                  router.push("/checkout");
                }}
              >
                {inStockItems.length === 0
                  ? "No items available for checkout"
                  : `Proceed to Checkout${outOfStockItems.length > 0 ? ` (${inStockItemCount} items)` : ""}`}
              </button>

              <Link
                href="/shop"
                className="mt-4 block w-full text-center text-sm text-stone-600 hover:text-stone-900"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
