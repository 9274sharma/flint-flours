"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import { getFinalPrice } from "@/lib/utils/price";
import type { Product } from "@/types/product";

export function ProductCard({ product }: { product: Product }) {
  const imageUrls = useMemo(() => product.image_urls || [], [product.image_urls]);
  const { addItem, getItemQuantity, updateQuantity } = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [validImageUrls, setValidImageUrls] = useState<string[]>(imageUrls);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  // Filter out broken image URLs
  useEffect(() => {
    setValidImageUrls(imageUrls.filter((_, index) => !imageErrors.has(index)));
  }, [imageUrls, imageErrors]);

  const handleImageError = (index: number) => {
    setImageErrors((prev) => new Set(prev).add(index));
  };

  // Auto-scroll through images when hovering
  useEffect(() => {
    if (!isHovered || validImageUrls.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % validImageUrls.length);
    }, 2000); // Change image every 2 seconds

    return () => clearInterval(interval);
  }, [isHovered, validImageUrls.length]);

  const imageUrl = validImageUrls[currentImageIndex] || validImageUrls[0] || null;

  // Filter active variants
  const activeVariants = product.product_variants.filter((v) => v.is_active);

  if (activeVariants.length === 0) {
    return null; // Don't render if no active variants
  }

  // Initialize selected variant (first in-stock variant, or first variant)
  const defaultVariantId =
    selectedVariantId ||
    activeVariants.find((v) => v.stock > 0)?.id ||
    activeVariants[0].id;

  const selectedVariant = activeVariants.find((v) => v.id === defaultVariantId) || activeVariants[0];
  const cartQuantity = getItemQuantity(product.id, selectedVariant.id);
  const isInCart = cartQuantity > 0;

  const displayPrice = getFinalPrice(
    selectedVariant.price,
    selectedVariant.discount_percent
  );
  const originalPrice = selectedVariant.price;
  const hasDiscount = selectedVariant.discount_percent > 0;
  const isInStock = selectedVariant.stock > 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isInStock) return;

    addItem({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      variantId: selectedVariant.id,
      variantName: selectedVariant.name,
      price: selectedVariant.price,
      discountPercent: selectedVariant.discount_percent,
      imageUrl: imageUrl,
    });

    // Show animation
    setShowAnimation(true);
    setTimeout(() => setShowAnimation(false), 1000);
  };

  const handleQuantityChange = (delta: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newQuantity = cartQuantity + delta;
    // updateQuantity handles removal when quantity <= 0
    updateQuantity(product.id, selectedVariant.id, newQuantity);
  };

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition hover:border-stone-300 hover:shadow-md">
      {/* Product Image - Clickable Link */}
      <Link
        href={`/shop/${product.slug}`}
        className="relative aspect-square bg-cream-100 overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setCurrentImageIndex(0); // Reset to first image when not hovering
        }}
      >
        {imageUrl ? (
          <AnimatePresence mode="wait">
            <motion.img
              key={currentImageIndex}
              src={imageUrl}
              alt={product.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full w-full object-cover transition group-hover:scale-105"
              onError={() => {
                const index = imageUrls.indexOf(imageUrl);
                if (index !== -1) handleImageError(index);
              }}
            />
          </AnimatePresence>
        ) : (
          <div className="flex h-full items-center justify-center text-stone-400">
            <span className="text-sm">No image</span>
          </div>
        )}
        
        {/* Image indicator dots (if multiple images) */}
        {validImageUrls.length > 1 && (
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {validImageUrls.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 w-1.5 rounded-full transition ${
                  index === currentImageIndex
                    ? "bg-white"
                    : "bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
        
        {/* Add to Cart Animation */}
        <AnimatePresence>
          {showAnimation && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 0 }}
              animate={{ opacity: 1, scale: 1, y: -50 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.5 }}
              className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2"
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
      </Link>

      {/* Product Info */}
      <div className="flex flex-1 flex-col p-4">
        <Link href={`/shop/${product.slug}`}>
          <span className="text-xs font-medium uppercase tracking-wide text-wheat-500">
            {product.sub_brand}
          </span>
          <h3 className="mt-1 font-serif font-semibold text-stone-850 group-hover:text-stone-950">
            {product.name}
          </h3>
        </Link>

        {/* Variant Selector (if multiple variants) */}
        {activeVariants.length > 1 ? (
          <div className="mt-2" onClick={(e) => e.stopPropagation()}>
            <select
              value={defaultVariantId}
              onChange={(e) => {
                setSelectedVariantId(e.target.value);
              }}
              className="w-full rounded-lg border border-stone-300 bg-white px-2 py-1 text-xs text-stone-900 focus:border-stone-500 focus:outline-none"
              onClick={(e) => e.stopPropagation()}
              aria-label="Select product variant"
            >
              {activeVariants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.name}
                  {variant.stock <= 0 ? " (Out of stock)" : ""}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <p className="mt-0.5 text-sm text-stone-600">
            {activeVariants[0].name}
          </p>
        )}

        {/* Price */}
        <div className="mt-auto pt-3">
          <div className="flex items-baseline gap-2 flex-wrap">
            {activeVariants.length > 1 && (
              <span className="text-xs text-stone-500">From</span>
            )}
            <span className="font-semibold text-stone-900">
              ₹{displayPrice.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </span>
            {hasDiscount && originalPrice > displayPrice && (
              <>
                <span className="text-sm text-stone-500 line-through">
                  ₹{originalPrice.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs font-medium text-green-600">
                  {selectedVariant.discount_percent}% off
                </span>
              </>
            )}
          </div>

          {/* Shelf Life */}
          {selectedVariant.shelf_life_days && (
            <p className="mt-1 text-xs text-stone-500">
              Shelf life: {selectedVariant.shelf_life_days} days
            </p>
          )}

          {/* Add to Cart / Quantity Controls */}
          <div className="mt-3" onClick={(e) => e.stopPropagation()}>
            {!isInStock ? (
              <p className="text-xs text-amber-600">Out of stock</p>
            ) : !isInCart ? (
              <button
                onClick={handleAddToCart}
                className="w-full rounded-lg bg-stone-850 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-900"
              >
                Add to cart
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleQuantityChange(-1, e)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-300 bg-white text-stone-700 transition hover:bg-stone-50"
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
                <span className="flex-1 text-center text-sm font-medium text-stone-900">
                  {cartQuantity} in cart
                </span>
                <button
                  onClick={(e) => handleQuantityChange(1, e)}
                  disabled={selectedVariant.stock <= cartQuantity}
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
