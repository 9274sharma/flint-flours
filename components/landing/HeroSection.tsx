"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { useCraftImages } from "@/lib/hooks/useCraftImages";
import { shuffleAndTake } from "@/lib/utils/array";

export function HeroSection() {
  const { images } = useCraftImages();
  const displayImages = useMemo(
    () => shuffleAndTake(images.map((img) => img.url), 6),
    [images]
  );

  return (
    <section className="relative min-h-[90vh] overflow-hidden bg-stone-100">
      {/* Image grid background */}
      <div className="absolute inset-0">
        <div className="grid h-full grid-cols-3 grid-rows-2 gap-1 p-2">
          {displayImages.map((src, i) => (
            <motion.div
              key={`${src}-${i}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="relative overflow-hidden rounded-lg"
            >
              <Image
                src={src}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 33vw, 20vw"
                priority
              />
            </motion.div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/50 to-stone-100" />
      </div>

      {/* Content overlay */}
      <div className="relative z-10 flex min-h-[90vh] flex-col items-center justify-center px-4 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="font-serif text-5xl font-bold tracking-tight text-stone-900 md:text-7xl lg:text-8xl"
        >
          Flint & Flours
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-4 max-w-2xl text-xl text-stone-700 md:text-2xl"
        >
          India&apos;s most trusted clean-label food science company
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <Link
            href="/shop"
            className="mt-10 inline-block rounded-full bg-stone-900 px-10 py-4 font-medium text-white transition hover:bg-stone-950 hover:scale-105 active:scale-[0.98]"
          >
            Shop Now
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
