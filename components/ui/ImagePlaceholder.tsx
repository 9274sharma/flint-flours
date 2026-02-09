"use client";

import { motion } from "framer-motion";

interface ImagePlaceholderProps {
  description: string;
  aspectRatio?: "video" | "square" | "portrait" | "landscape";
  className?: string;
}

const aspectClasses = {
  video: "aspect-video",
  square: "aspect-square",
  portrait: "aspect-[3/4]",
  landscape: "aspect-[4/3]",
};

export function ImagePlaceholder({
  description,
  aspectRatio = "landscape",
  className = "",
}: ImagePlaceholderProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className={`flex ${aspectClasses[aspectRatio]} items-center justify-center rounded-xl border-2 border-dashed border-stone-300 bg-stone-100/80 ${className}`}
    >
      <div className="max-w-[80%] px-4 text-center">
        <p className="text-sm font-medium text-stone-500">
          [ Image placeholder ]
        </p>
        <p className="mt-1 text-xs text-stone-400">{description}</p>
      </div>
    </motion.div>
  );
}
