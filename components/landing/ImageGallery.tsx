"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCraftImages } from "@/lib/hooks/useCraftImages";

export function ImageGallery() {
  const { images } = useCraftImages();
  const displayImages = images.length > 0 ? images.map((img) => img.url) : [];

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="bg-stone-100 py-20 md:py-28"
    >
      <div className="mx-auto max-w-7xl px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center font-serif text-3xl font-semibold text-stone-850 md:text-4xl"
        >
          Our Craft
        </motion.h2>
        {displayImages.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {displayImages.map((src, i) => (
              <motion.div
                key={src}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="group relative aspect-square overflow-hidden rounded-2xl border border-stone-200 shadow-md"
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  className="object-cover transition duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </motion.div>
            ))}
          </div>
        ) : null}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <Link
            href="/shop"
            className="inline-block rounded-full border-2 border-stone-800 px-8 py-3 font-medium text-stone-800 transition hover:bg-stone-800 hover:text-white active:scale-[0.98]"
          >
            Explore All Products
          </Link>
        </motion.div>
      </div>
    </motion.section>
  );
}
