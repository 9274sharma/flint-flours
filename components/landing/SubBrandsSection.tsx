"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function SubBrandsSection() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="bg-gradient-to-b from-stone-50 to-white py-20 md:py-28"
    >
      <div className="mx-auto max-w-5xl px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14 text-center font-serif text-3xl font-semibold text-stone-850 md:text-4xl"
        >
          Our Brands
        </motion.h2>
        <div className="grid gap-8 md:grid-cols-2">
          <Link href="/shop?brand=flint-flours">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
              className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-stone-200 shadow-md transition-all duration-300 hover:border-wheat-400 hover:shadow-xl"
            >
              {/* Logo as background - centered, contained, padding, blend with card bg */}
              <div
                className="absolute inset-4 rounded-xl bg-center bg-no-repeat transition-transform duration-500 group-hover:scale-105 md:inset-6"
                style={{
                  backgroundImage: "url(/flint-flours-logo.jpeg)",
                  backgroundSize: "contain",
                  backgroundColor: "#ffffff",
                }}
              />
              {/* Glass overlay - slides up from bottom on hover */}
              <div className="absolute inset-x-0 bottom-0 flex translate-y-full flex-col justify-end rounded-b-2xl border-t border-white/30 p-6 backdrop-blur-md transition-all duration-500 ease-out group-hover:translate-y-0 group-hover:bg-white/70 group-hover:backdrop-blur-xl">
                <p className="text-sm leading-relaxed text-stone-700">
                  Artisan bakery—breads, buns, bagels, and pizza bases made with
                  millets and clean ingredients.
                </p>
                <span className="mt-4 inline-flex w-fit items-center gap-2 self-center rounded-full bg-stone-800/90 px-5 py-2.5 text-sm font-medium text-white shadow-lg transition-colors group-hover:bg-wheat-600">
                  Shop Flint & Flours
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </div>
            </motion.div>
          </Link>
          <Link href="/shop?brand=milora">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
              className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-stone-200 shadow-md transition-all duration-300 hover:border-wheat-400 hover:shadow-xl"
            >
              {/* Logo as background - centered, contained, padding, cream bg to blend */}
              <div
                className="absolute inset-4 rounded-xl bg-center bg-no-repeat transition-transform duration-500 group-hover:scale-105 md:inset-6"
                style={{
                  backgroundImage: "url(/milora-logo.jpeg)",
                  backgroundSize: "contain",
                  backgroundColor: "#f8eddb",
                }}
              />
              {/* Glass overlay - slides up from bottom on hover */}
              <div className="absolute inset-x-0 bottom-0 flex translate-y-full flex-col justify-end rounded-b-2xl border-t border-white/30 p-6 backdrop-blur-md transition-all duration-500 ease-out group-hover:translate-y-0 group-hover:bg-white/70 group-hover:backdrop-blur-xl">
                <p className="text-sm leading-relaxed text-stone-700">
                  Cookies, cakes, and sweets—thoughtfully crafted for everyday
                  indulgence.
                </p>
                <span className="mt-4 inline-flex w-fit items-center gap-2 self-center rounded-full bg-stone-800/90 px-5 py-2.5 text-sm font-medium text-white shadow-lg transition-colors group-hover:bg-wheat-600">
                  Shop Milora
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </div>
            </motion.div>
          </Link>
        </div>
      </div>
    </motion.section>
  );
}
