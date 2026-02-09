"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/landing/Header";
import { createClient } from "@/lib/supabase/client";

type Order = {
  id: string;
  status: string;
  total: number;
  created_at: string;
  address: {
    line1: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  } | null;
  order_items: Array<{
    quantity: number;
    price_at_order: number;
    product: {
      name: string;
      slug: string;
    };
  }>;
};

export default function OrderSuccessPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        const { data, error: orderError } = await supabase
          .from("orders")
          .select(
            `
            id,
            status,
            total,
            created_at,
            address:addresses (
              line1,
              city,
              state,
              pincode,
              phone
            ),
            order_items (
              quantity,
              price_at_order,
              product:products (
                name,
                slug
              )
            )
          `
          )
          .eq("id", orderId)
          .eq("user_id", user.id)
          .single();

        if (orderError) {
          throw orderError;
        }

        if (!data) return;

        // Transform Supabase response (nested relations may be arrays)
        const address = data.address
          ? (Array.isArray(data.address) ? data.address[0] : data.address)
          : null;
        const order_items = (data.order_items ?? []).map(
          (item: { quantity: number; price_at_order: number; product: { name: string; slug: string } | { name: string; slug: string }[] }) => ({
            quantity: item.quantity,
            price_at_order: item.price_at_order,
            product: Array.isArray(item.product) ? item.product[0] : item.product,
          })
        );
        setOrder({ ...data, address, order_items } as Order);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load order");
      } finally {
        setIsLoading(false);
      }
    }

    if (orderId) {
      fetchOrder();
    }
  }, [orderId, router]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-cream-50 to-cream-100">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">Loading order details...</div>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-cream-50 to-cream-100">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="rounded-lg bg-red-50 p-6 text-red-800">
            {error || "Order not found"}
          </div>
          <Link
            href="/account"
            className="mt-4 inline-block text-stone-600 hover:text-stone-900"
          >
            ← Back to Account
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-cream-50 to-cream-100">
      <Header />
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="mb-2 text-3xl font-bold text-stone-900">
              Order Placed Successfully!
            </h1>
            <p className="text-stone-600">
              Thank you for your order. We&apos;ll send you a confirmation email
              shortly.
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="mb-6 border-b border-stone-200 pb-4">
              <h2 className="mb-2 text-lg font-semibold text-stone-900">
                Order Details
              </h2>
              <div className="space-y-1 text-sm text-stone-600">
                <p>
                  <span className="font-medium">Order ID:</span>{" "}
                  {order.id.slice(0, 8).toUpperCase()}
                </p>
                <p>
                  <span className="font-medium">Status:</span>{" "}
                  <span className="capitalize">{order.status}</span>
                </p>
                <p>
                  <span className="font-medium">Date:</span>{" "}
                  {new Date(order.created_at).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p>
                  <span className="font-medium">Total:</span> ₹
                  {parseFloat(order.total.toString()).toLocaleString("en-IN", {
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>

            {order.address && (
              <div className="mb-6 border-b border-stone-200 pb-4">
                <h2 className="mb-2 text-lg font-semibold text-stone-900">
                  Delivery Address
                </h2>
                <p className="text-sm text-stone-600">
                  {order.address.line1}, {order.address.city},{" "}
                  {order.address.state} {order.address.pincode}
                </p>
                <p className="mt-1 text-sm text-stone-600">
                  Phone: {order.address.phone}
                </p>
              </div>
            )}

            <div>
              <h2 className="mb-4 text-lg font-semibold text-stone-900">
                Order Items
              </h2>
              <div className="space-y-2">
                {order.order_items.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between border-b border-stone-100 pb-2"
                  >
                    <div>
                      <p className="font-medium text-stone-900">
                        {item.product.name}
                      </p>
                      <p className="text-sm text-stone-600">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium text-stone-900">
                      ₹
                      {(
                        parseFloat(item.price_at_order.toString()) *
                        item.quantity
                      ).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <Link
              href="/shop"
              className="flex-1 rounded-lg border border-stone-300 bg-white px-6 py-3 text-center font-medium text-stone-900 transition hover:bg-stone-50"
            >
              Continue Shopping
            </Link>
            <Link
              href="/account"
              className="flex-1 rounded-lg bg-stone-850 px-6 py-3 text-center font-medium text-white transition hover:bg-stone-900"
            >
              View Orders
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
