"use client";

import { useEffect, useState } from "react";
import { ReviewSkeleton } from "@/components/ui/Skeleton";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  author?: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reviews?productId=${productId}&page=${page}&limit=4`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.reviews) {
          setReviews(data.reviews);
          setPagination(data.pagination);
          setAvgRating(data.avgRating ?? 0);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId, page]);

  if (loading) {
    return (
      <div className="mt-12 border-t border-stone-200 pt-8">
        <h2 className="font-serif text-xl font-semibold text-stone-900">
          Customer reviews
        </h2>
        <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl bg-stone-50 px-5 py-4">
          <div className="h-9 w-16 animate-pulse rounded bg-stone-200" />
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-5 w-5 animate-pulse rounded bg-stone-200" />
            ))}
          </div>
        </div>
        <ul className="mt-6 space-y-4" aria-busy="true" aria-label="Loading reviews">
          {[1, 2, 3, 4].map((i) => (
            <li key={i}>
              <ReviewSkeleton />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (!loading && reviews.length === 0 && (!pagination || pagination.total === 0)) {
    return (
      <div className="mt-12 border-t border-stone-200 pt-8">
        <h2 className="font-serif text-xl font-semibold text-stone-900">
          Customer reviews
        </h2>
        <p className="mt-4 text-sm text-stone-500">
          No reviews yet. Be the first to review this product!
        </p>
      </div>
    );
  }

  const pag = pagination;
  const total = pag?.total ?? 0;

  return (
    <div className="mt-12 border-t border-stone-200 pt-8">
      <h2 className="font-serif text-xl font-semibold text-stone-900">
        Customer reviews
      </h2>
      <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl bg-stone-50 px-5 py-4">
        <div className="flex items-baseline gap-3">
          <span className="font-serif text-3xl font-bold text-stone-900">
            {avgRating.toFixed(1)}
          </span>
          <div className="flex flex-col">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((r) => (
                <span
                  key={r}
                  className={
                    r <= Math.round(avgRating)
                      ? "text-amber-400"
                      : "text-stone-300"
                  }
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-xs text-stone-500">
              Based on {total} {total === 1 ? "review" : "reviews"}
            </span>
          </div>
        </div>
      </div>
      <ul className="mt-6 space-y-4" role="list" aria-label="Product reviews">
        {reviews.map((review) => (
          <li
            key={review.id}
            role="listitem"
            className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((r) => (
                      <span
                        key={r}
                        className={
                          r <= review.rating
                            ? "text-amber-400"
                            : "text-stone-300"
                        }
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="font-medium text-stone-900">
                    {review.author || "Customer"}
                  </span>
                  <span className="text-xs text-stone-400">•</span>
                  <span className="text-xs text-stone-500">
                    {new Date(review.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                {review.comment ? (
                  <p className="text-stone-700 leading-relaxed">
                    {review.comment}
                  </p>
                ) : (
                  <p className="text-sm italic text-stone-400">
                    No written review
                  </p>
                )}
              </div>
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-stone-200 text-sm font-semibold text-stone-600">
                {(review.author || "C").charAt(0).toUpperCase()}
              </div>
            </div>
          </li>
        ))}
      </ul>
      {pag && pag.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 disabled:opacity-50 hover:bg-stone-50"
            aria-label="Previous page of reviews"
          >
            Previous
          </button>
          <span className="text-sm text-stone-600">
            Page {page} of {pag.totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pag.totalPages, p + 1))}
            disabled={page >= pag.totalPages}
            className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 disabled:opacity-50 hover:bg-stone-50"
            aria-label="Next page of reviews"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
