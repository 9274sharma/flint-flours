"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import { getFinalPrice } from "@/lib/utils/price";
import type { Product } from "@/types/product";

export function ProductDetailClient({ product }: { product: Product }) {
  const { addItem, getItemQuantity, updateQuantity } = useCart();
  const imageUrls = product.image_urls || [];
  const activeVariants =
    product.product_variants?.filter((v) => v.is_active) || [];

  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    activeVariants[0]?.id || "",
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showAnimation, setShowAnimation] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  // Filter out broken image URLs
  const validImageUrls = imageUrls.filter((_, index) => !imageErrors.has(index));

  // Reset selected index if current image is removed
  useEffect(() => {
    if (selectedImageIndex >= validImageUrls.length && validImageUrls.length > 0) {
      setSelectedImageIndex(0);
    }
  }, [selectedImageIndex, validImageUrls.length]);

  const handleImageError = (index: number) => {
    setImageErrors((prev) => new Set(prev).add(index));
  };

  const selectedVariant =
    activeVariants.find((v) => v.id === selectedVariantId) || activeVariants[0];

  const finalPrice = getFinalPrice(
    selectedVariant.price,
    selectedVariant.discount_percent,
  );
  const hasDiscount = selectedVariant.discount_percent > 0;
  const isInStock = selectedVariant.stock > 0;
  const cartQuantity = getItemQuantity(product.id, selectedVariant.id);
  const isInCart = cartQuantity > 0;

  const handleAddToCart = () => {
    if (!isInStock) return;

    addItem({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      variantId: selectedVariant.id,
      variantName: selectedVariant.name,
      price: selectedVariant.price,
      discountPercent: selectedVariant.discount_percent,
      imageUrl: validImageUrls[0] || null,
    });

    // Show animation
    setShowAnimation(true);
    setTimeout(() => setShowAnimation(false), 1000);
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = cartQuantity + delta;
    // updateQuantity handles removal when quantity <= 0
    updateQuantity(product.id, selectedVariant.id, newQuantity);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Image Gallery */}
      <div className="relative">
        <div className="aspect-square overflow-hidden rounded-2xl border border-stone-200 bg-cream-100">
          {validImageUrls[selectedImageIndex] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={validImageUrls[selectedImageIndex]}
              alt={product.name}
              className="h-full w-full object-cover"
              onError={() => {
                const index = imageUrls.indexOf(validImageUrls[selectedImageIndex]);
                if (index !== -1) handleImageError(index);
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-stone-400">
              No image
            </div>
          )}
        </div>

        {/* Add to Cart Animation */}
        <AnimatePresence>
          {showAnimation && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 0 }}
              animate={{ opacity: 1, scale: 1, y: -50 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.5 }}
              className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2"
            >
              <div className="flex items-center gap-2 rounded-full bg-green-500 px-4 py-2 text-white shadow-lg">
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
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span className="font-medium">Added!</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {validImageUrls.length > 1 && (
          <div className="mt-4 grid grid-cols-5 gap-2">
            {validImageUrls.map((url, index) => {
              const originalIndex = imageUrls.indexOf(url);
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedImageIndex(index)}
                  className={`aspect-square overflow-hidden rounded-lg border-2 transition ${
                    selectedImageIndex === index
                      ? "border-stone-900"
                      : "border-stone-200 hover:border-stone-300"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`${product.name} ${index + 1}`}
                    className="h-full w-full object-cover"
                    onError={() => {
                      if (originalIndex !== -1) handleImageError(originalIndex);
                    }}
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Product Details */}
      <div>
        <span className="text-sm font-medium uppercase tracking-wide text-wheat-500">
          {product.sub_brand}
        </span>
        <h1 className="mt-2 font-serif text-3xl font-bold text-stone-850">
          {product.name}
        </h1>
        <p className="mt-1 text-sm text-stone-500">{product.category}</p>

        {/* Variant Selector */}
        {activeVariants.length > 1 && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-stone-700">
              Select Variant:
            </label>
            <select
              aria-label="Select product variant"
              value={selectedVariantId}
              onChange={(e) => setSelectedVariantId(e.target.value)}
              className="mt-2 w-full rounded-lg border border-stone-300 bg-white px-4 py-2 text-stone-900 focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-200"
            >
              {activeVariants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.name}
                  {variant.stock <= 0 ? " (Out of stock)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Selected Variant Info */}
        <div className="mt-6">
          {activeVariants.length === 1 && (
            <p className="text-stone-600">{selectedVariant.name}</p>
          )}

          {selectedVariant.description && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-stone-700">
                Description:
              </h3>
              <p className="mt-1 whitespace-pre-wrap text-stone-600">
                {selectedVariant.description}
              </p>
            </div>
          )}

          {/* Price */}
          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-2xl font-bold text-stone-900">
              ₹
              {finalPrice.toLocaleString("en-IN", {
                maximumFractionDigits: 2,
              })}
            </span>
            {hasDiscount && selectedVariant.price > finalPrice && (
              <>
                <span className="text-lg text-stone-500 line-through">
                  ₹
                  {selectedVariant.price.toLocaleString("en-IN", {
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="rounded bg-green-100 px-2 py-1 text-sm font-medium text-green-700">
                  {selectedVariant.discount_percent}% off
                </span>
              </>
            )}
          </div>

          {/* Stock Status */}
          {selectedVariant.stock > 0 ? (
            <p className="mt-2 text-sm text-green-600">
              In stock ({selectedVariant.stock} available)
            </p>
          ) : (
            <p className="mt-2 text-sm text-amber-600">Out of stock</p>
          )}

          {/* Shelf Life */}
          {selectedVariant.shelf_life_days && (
            <p className="mt-2 text-sm text-stone-500">
              Shelf life: {selectedVariant.shelf_life_days} days
            </p>
          )}

          {/* GST Info */}
          {(selectedVariant.gst_percent ?? 0) > 0 && (
            <p className="mt-1 text-xs text-stone-500">
              GST ({(selectedVariant.gst_percent ?? 0)}%) included
            </p>
          )}

          {/* Add to Cart / Quantity Controls */}
          {!isInStock ? (
            <button
              type="button"
              disabled
              className="mt-6 w-full cursor-not-allowed rounded-xl bg-stone-300 px-8 py-3 font-medium text-stone-500"
            >
              Out of stock
            </button>
          ) : !isInCart ? (
            <button
              type="button"
              onClick={handleAddToCart}
              className="mt-6 w-full rounded-xl bg-stone-850 px-8 py-3 font-medium text-white transition hover:bg-stone-900"
            >
              Add to cart
            </button>
          ) : (
            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleQuantityChange(-1)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-stone-300 bg-white text-stone-700 transition hover:bg-stone-50"
                aria-label="Decrease quantity"
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
                    d="M20 12H4"
                  />
                </svg>
              </button>
              <span className="flex-1 text-center text-lg font-medium text-stone-900">
                {cartQuantity} in cart
              </span>
              <button
                type="button"
                onClick={() => handleQuantityChange(1)}
                disabled={selectedVariant.stock <= cartQuantity}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-stone-300 bg-white text-stone-700 transition hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Increase quantity"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* HSN Code */}
        {product.hsn_code && (
          <div className="mt-8 border-t border-stone-200 pt-6">
            <p className="text-xs text-stone-500">
              HSN Code: {product.hsn_code}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
