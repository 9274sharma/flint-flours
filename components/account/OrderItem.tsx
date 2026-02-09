"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/contexts/ToastContext";

type OrderItem = {
  product_id: string;
  quantity: number;
  price_at_order: number;
  product: {
    name: string;
    slug: string;
    image_urls?: string[] | null;
  };
  variant?: {
    name: string;
    slug: string;
  };
};

type Order = {
  id: string;
  status: string;
  order_status?: string;
  total: number;
  created_at: string;
  order_items: OrderItem[];
  address?: {
    line1: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  } | null;
};

type ReviewByOrder = { rating: number; comment: string | null } | undefined;

function OrderReviewForm({
  orderId,
  existingReview,
  onSaved,
}: {
  orderId: string;
  existingReview?: ReviewByOrder;
  onSaved: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [comment, setComment] = useState(existingReview?.comment ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(!!existingReview);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          rating,
          comment: comment.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
      onSaved();
      toast("Review saved.", "success");
      router.refresh();
    } catch {
      toast("Failed to save review. Please try again.");
      setSubmitting(false);
    }
  };

  if (saved || existingReview) {
    const show = existingReview ?? { rating, comment };
    return (
      <div className="mt-2 rounded-lg border border-stone-100 bg-stone-50 p-3">
        <p className="text-xs font-medium text-stone-600 mb-1">Your review</p>
        <div className="flex items-center gap-1 mb-1">
          {[1, 2, 3, 4, 5].map((r) => (
            <span
              key={r}
              className={r <= (show.rating ?? 0) ? "text-amber-400" : "text-stone-300"}
            >
              ★
            </span>
          ))}
        </div>
        {show.comment && (
          <p className="text-sm text-stone-700">{show.comment}</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 rounded-lg border border-stone-100 bg-stone-50 p-3">
      <p className="text-xs font-medium text-stone-600 mb-2">Add a review</p>
      <div className="flex items-center gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRating(r)}
            className={`text-xl transition focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-1 rounded ${r <= rating ? "text-amber-400" : "text-stone-300 hover:text-amber-200"}`}
            aria-label={`Rate ${r} out of 5 stars`}
            aria-pressed={r <= rating ? "true" : "false"}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Write your review..."
        rows={2}
        className="w-full rounded border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-stone-400"
        aria-label="Review comment"
      />
      <button
        type="submit"
        disabled={submitting || rating < 1}
        className="mt-2 rounded-lg bg-stone-800 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50 hover:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2"
        aria-label="Submit review"
      >
        {submitting ? "Saving..." : "Submit review"}
      </button>
    </form>
  );
}

export function OrderItemCard({
  order,
  reviewByOrder,
}: {
  order: Order;
  reviewByOrder?: ReviewByOrder;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const subtotal = order.order_items.reduce(
    (sum, item) => sum + parseFloat(item.price_at_order.toString()) * item.quantity,
    0
  );

  const gst = order.total - subtotal; // GST is included in total

  return (
    <li className="rounded-lg border border-stone-100 bg-cream-50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="font-medium text-stone-850">
            Order #{order.id.slice(0, 8)}
          </p>
          <p className="text-sm text-stone-500">
            {new Date(order.created_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
          {order.order_items && order.order_items.length > 0 && (
            <p className="mt-1 text-sm text-stone-600">
              {order.order_items.length} {order.order_items.length === 1 ? "item" : "items"}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right flex items-center gap-2 flex-wrap justify-end">
            <p className="font-semibold text-stone-900">
              ₹{Number(order.total).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </p>
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  order.status === "paid"
                    ? "bg-green-100 text-green-800"
                    : order.status === "refunded"
                      ? "bg-purple-100 text-purple-800"
                      : order.status === "failed" || order.status === "cancelled"
                        ? "bg-red-100 text-red-800"
                        : "bg-amber-100 text-amber-800"
                }`}
              >
                {order.status}
              </span>
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  (order.order_status ?? "placed") === "delivered"
                    ? "bg-green-100 text-green-800"
                    : (order.order_status ?? "placed") === "shipped"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-stone-200 text-stone-700"
                }`}
              >
                {(order.order_status ?? "placed")}
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 rounded-lg p-2 text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-1"
            aria-label={isExpanded ? "Hide order details" : "Show order details"}
            aria-expanded={isExpanded ? "true" : "false"}
          >
            <svg
              className={`h-5 w-5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 border-t border-stone-200 pt-4 space-y-4">
          {/* Order Items */}
          <div>
            <h3 className="text-sm font-semibold text-stone-900 mb-2">Order Items</h3>
            <div className="space-y-2">
              {order.order_items.map((item, index) => {
                const itemTotal = parseFloat(item.price_at_order.toString()) * item.quantity;
                const imageUrls = (item.product.image_urls as string[]) || [];
                const imageUrl = imageUrls[0] || null;
                return (
                  <div
                    key={index}
                    className="flex items-start gap-4 rounded-lg bg-white p-3 border border-stone-100"
                  >
                    {imageUrl && (
                      <Link
                        href={`/shop/${item.product.slug}`}
                        className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-stone-200"
                      >
                        <Image
                          src={imageUrl}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      </Link>
                    )}
                    {!imageUrl && (
                      <div className="h-16 w-16 flex-shrink-0 rounded-lg border border-stone-200 bg-stone-100 flex items-center justify-center">
                        <span className="text-xs text-stone-400">No image</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/shop/${item.product.slug}`}
                        className="font-medium text-stone-900 hover:text-stone-700"
                      >
                        {item.product.name}
                      </Link>
                      {item.variant && (
                        <p className="text-sm text-stone-600 mt-0.5">
                          Variant: {item.variant.name}
                        </p>
                      )}
                      <p className="text-sm text-stone-500 mt-1">
                        Quantity: {item.quantity} × ₹{parseFloat(item.price_at_order.toString()).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-stone-900">
                        ₹{itemTotal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivery Address */}
          {order.address && (
            <div>
              <h3 className="text-sm font-semibold text-stone-900 mb-2">Delivery Address</h3>
              <div className="rounded-lg bg-white p-3 border border-stone-100">
                <p className="text-stone-700">{order.address.line1}</p>
                <p className="text-stone-600">
                  {order.address.city}, {order.address.state} {order.address.pincode}
                </p>
                <p className="text-sm text-stone-600 mt-1">
                  Phone: {order.address.phone}
                </p>
              </div>
            </div>
          )}

          {/* Order Summary */}
          <div>
            <h3 className="text-sm font-semibold text-stone-900 mb-2">Order Summary</h3>
            <div className="rounded-lg bg-white p-3 border border-stone-100 space-y-2">
              <div className="flex justify-between text-stone-700">
                <span>
                  Subtotal <span className="text-xs text-stone-500">(GST included)</span>
                </span>
                <span>₹{subtotal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
              </div>
              {gst > 0 && (
                <div className="flex justify-between text-stone-700">
                  <span>GST</span>
                  <span>₹{gst.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-stone-200 pt-2 font-semibold text-stone-900">
                <span>Total</span>
                <span>₹{Number(order.total).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Review - outside items, under Order Summary */}
          <OrderReviewForm
            orderId={order.id}
            existingReview={reviewByOrder}
            onSaved={() => {}}
          />
        </div>
      )}
    </li>
  );
}
