"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const FALLBACK_REVIEWS = [
  { id: "1", text: "The Jowar bread is a game-changer. Finally, bread I can eat daily without feeling heavy.", author: "Customer", rating: 5 },
  { id: "2", text: "Clean ingredients, honest taste. My family loves the multigrain loaf—perfect for sandwiches.", author: "Customer", rating: 5 },
  { id: "3", text: "From a doctor who gets it. Food that nourishes without compromise. Highly recommend.", author: "Customer", rating: 5 },
];

export function ReviewsCarousel() {
  const [reviews, setReviews] = useState<{ id: string; text: string; author: string; rating: number }[]>(FALLBACK_REVIEWS);
  const [active, setActive] = useState(0);

  useEffect(() => {
    fetch("/api/reviews?top=8")
      .then((r) => r.json())
      .then((data) => {
        type ReviewApi = { id: string; comment?: string | null; author?: string; rating?: number };
        if (Array.isArray(data) && data.length > 0) {
          setReviews(
            (data as ReviewApi[])
              .map((r) => ({
                id: r.id,
                text: r.comment || "",
                author: r.author ?? "Customer",
                rating: r.rating ?? 5,
              }))
              .filter((r) => r.text)
          );
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (reviews.length === 0) return;
    const t = setInterval(() => {
      setActive((p) => (p + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(t);
  }, [reviews.length]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white py-20 md:py-28"
    >
      <div className="mx-auto max-w-4xl px-4">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center font-serif text-3xl font-semibold text-stone-900 md:text-4xl"
        >
          What our customers say
        </motion.h2>

        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait">
            {reviews.length > 0 && (
              <motion.div
                key={active}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="text-center"
              >
                <div className="mb-4 flex justify-center gap-1">
                  {Array.from({ length: reviews[active].rating }).map((_, i) => (
                    <span key={i} className="text-amber-400">
                      ★
                    </span>
                  ))}
                </div>
                <blockquote className="text-xl font-medium italic text-stone-700 md:text-2xl">
                  &ldquo;{reviews[active].text}&rdquo;
                </blockquote>
                <p className="mt-4 text-sm text-stone-500">
                  — {reviews[active].author}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-10 flex justify-center gap-2">
          {reviews.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`h-2 rounded-full transition-all ${
                i === active ? "w-8 bg-stone-900" : "w-2 bg-stone-300"
              }`}
              aria-label={`Go to review ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </motion.section>
  );
}
