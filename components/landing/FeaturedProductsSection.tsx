"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { getFinalPrice } from "@/lib/utils/price";
import type { Product } from "@/types/product";
import { logger } from "@/lib/logger";

export function FeaturedProductsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const res = await fetch("/api/products?featured=true&limit=8");
        if (res.ok) {
          const data = await res.json();
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        logger.error("Error fetching featured products", { error: String(error) });
      } finally {
        setLoading(false);
      }
    }
    fetchFeatured();
  }, []);

  if (loading) {
    return (
      <section className="border-t border-stone-200 bg-white py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center font-serif text-3xl font-semibold text-stone-900 md:text-4xl">
            Featured Products
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-stone-600">
            Our bestsellers—breads, buns, and more made with millets and clean
            ingredients.
          </p>
          <div className="mt-10 flex justify-center">
            <p className="text-stone-500">Loading...</p>
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className="border-t border-stone-200 bg-white py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center font-serif text-3xl font-semibold text-stone-900 md:text-4xl">
            Featured Products
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-stone-600">
            Our bestsellers—breads, buns, and more made with millets and clean
            ingredients.
          </p>
          <div className="mt-10 text-center">
            <Link
              href="/shop"
              className="inline-block rounded-full bg-stone-900 px-8 py-3 font-medium text-white transition hover:bg-stone-950"
            >
              Shop All
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="border-t border-stone-200 bg-white py-16 md:py-24"
    >
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center font-serif text-3xl font-semibold text-stone-900 md:text-4xl">
          Featured Products
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-stone-600">
          Our bestsellers—breads, buns, and more made with millets and clean
          ingredients.
        </p>
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {products.map((product, i) => {
            const variants = product.product_variants?.filter(
              (v) => v.is_active && v.stock > 0
            ) || [];
            const cheapestVariant = variants.length > 0
              ? variants.reduce((min, v) =>
                  getFinalPrice(v.price, v.discount_percent) <
                  getFinalPrice(min.price, min.discount_percent)
                    ? v
                    : min
                )
              : product.product_variants?.[0];
            const imageUrl = product.image_urls?.[0] || null;

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  href={`/shop/${product.slug}`}
                  className="group block overflow-hidden rounded-xl border border-stone-200 transition hover:border-stone-400 hover:shadow-lg"
                >
                  <div className="relative aspect-square bg-cream-100">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover transition duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-stone-400">
                        <span className="text-sm">No image</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-medium text-stone-900">{product.name}</p>
                    {cheapestVariant ? (
                      <p className="text-sm text-stone-500">
                        {variants.length > 1 ? "From " : ""}
                        ₹
                        {getFinalPrice(
                          cheapestVariant.price,
                          cheapestVariant.discount_percent
                        ).toLocaleString("en-IN", {
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    ) : (
                      <p className="text-sm text-stone-500">Shop now</p>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
        <div className="mt-10 text-center">
          <Link
            href="/shop"
            className="inline-block rounded-full bg-stone-900 px-8 py-3 font-medium text-white transition hover:bg-stone-950"
          >
            Shop All
          </Link>
        </div>
      </div>
    </motion.section>
  );
}
