"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function WhyNoSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-amber-300 py-20 md:py-28"
    >
      <div className="mx-auto max-w-3xl px-4 text-center">
        <motion.h2
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="font-serif text-4xl font-bold text-stone-950 md:text-5xl"
        >
          WHY NO?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mt-4 text-xl text-stone-800"
        >
          A simple question.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-2 text-lg text-stone-750"
        >
          Healthy snacks that don&apos;t taste like punishment.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <Link
            href="/shop"
            className="mt-8 inline-block rounded-full bg-stone-900 px-10 py-4 font-medium text-white transition hover:bg-stone-950 hover:scale-105 active:scale-[0.98]"
          >
            TELL ME WHY NOT
          </Link>
        </motion.div>
      </div>
    </motion.section>
  );
}
