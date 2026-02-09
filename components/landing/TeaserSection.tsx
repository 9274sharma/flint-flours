"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface TeaserSectionProps {
  title: string;
  excerpt: string;
  href: string;
  ctaText: string;
  image?: React.ReactNode;
  reverse?: boolean;
}

export function TeaserSection({
  title,
  excerpt,
  href,
  ctaText,
  image,
  reverse = false,
}: TeaserSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="py-16 md:py-24"
    >
      <div
        className={`mx-auto flex max-w-6xl flex-col gap-8 px-4 md:flex-row md:items-center md:gap-12 ${
          reverse ? "md:flex-row-reverse" : ""
        }`}
      >
        <motion.div
          initial={{ opacity: 0, x: reverse ? 24 : -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="flex-1"
        >
          {image}
        </motion.div>
        <div className="flex flex-1 flex-col justify-center">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-2xl font-semibold text-stone-900 md:text-3xl"
          >
            {title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-stone-600"
          >
            {excerpt}
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Link
              href={href}
              className="group mt-6 inline-flex items-center gap-2 font-medium text-stone-900 transition hover:text-stone-700"
            >
              {ctaText}
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
