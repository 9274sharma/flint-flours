"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useToast } from "@/contexts/ToastContext";
import { OrderRowSkeleton } from "@/components/ui/Skeleton";

const PAYMENT_STATUSES = [
  "paid",
  "pending",
  "refunded",
  "failed",
  "cancelled",
] as const;
const ORDER_STATUSES = ["placed", "shipped", "delivered"] as const;
const DATE_FILTERS = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "week", label: "Last 7 days" },
  { value: "month", label: "Last 30 days" },
] as const;

type OrderItem = {
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

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [dateFilter, setDateFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("");
  const [orderIdFilter, setOrderIdFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("dateFilter", dateFilter);
      if (statusFilter) params.set("status", statusFilter);
      if (orderStatusFilter) params.set("order_status", orderStatusFilter);
      if (orderIdFilter) params.set("orderId", orderIdFilter);

      const res = await fetch(`/api/orders?${params}`);
      if (!res.ok) {
        if (res.status === 401) {
          setError("Please sign in as admin.");
          return;
        }
        throw new Error("Failed to fetch");
      }
      const data = await res.json();
      setOrders(Array.isArray(data.orders) ? data.orders : []);
      setPagination(data.pagination || null);
    } catch {
      setError("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, [page, dateFilter, statusFilter, orderStatusFilter, orderIdFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateOrderStatus = async (
    orderId: string,
    field: "status" | "order_status",
    value: string,
  ) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error("Update failed");
      const updated = await res.json();
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: updated.status ?? o.status,
                order_status: updated.order_status ?? o.order_status,
              }
            : o,
        ),
      );
      toast("Status updated.", "success");
    } catch {
      toast("Failed to update status. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <div className="mt-6 overflow-x-auto rounded-lg border">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-700">
                  Order
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-700">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-700">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-700">
                  Payment
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-700">
                  Order Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-700">
                  Items
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {[...Array(5)].map((_, i) => (
                <OrderRowSkeleton key={i} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="mt-4 text-amber-600">{error}</p>
      </div>
    );
  }

  const pag = pagination;
  const totalPages = pag?.totalPages ?? 1;
  const currentPage = pag?.page ?? 1;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Orders</h1>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-center gap-4 rounded-lg border bg-white p-4">
        <div>
          <label className="text-xs font-medium text-gray-600">Date</label>
          <select
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPage(1);
            }}
            className="ml-2 rounded border border-gray-300 px-3 py-1.5 text-sm"
            aria-label="Filter by date"
          >
            {DATE_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Payment</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="ml-2 rounded border border-gray-300 px-3 py-1.5 text-sm"
            aria-label="Filter by payment status"
          >
            <option value="">All</option>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">
            Order status
          </label>
          <select
            value={orderStatusFilter}
            onChange={(e) => {
              setOrderStatusFilter(e.target.value);
              setPage(1);
            }}
            className="ml-2 rounded border border-gray-300 px-3 py-1.5 text-sm"
            aria-label="Filter by order status"
          >
            <option value="">All</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Order ID</label>
          <input
            type="text"
            value={orderIdFilter}
            onChange={(e) => {
              setOrderIdFilter(e.target.value);
              setPage(1);
            }}
            placeholder="Search by order ID"
            className="ml-2 rounded border border-gray-300 px-3 py-1.5 text-sm"
            aria-label="Search by order ID"
          />
        </div>
      </div>

      {orders.length === 0 ? (
        <p className="mt-8 text-gray-700">No orders yet.</p>
      ) : (
        <>
          <div className="mt-6 overflow-x-auto rounded-lg border">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-700">
                    Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-700">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-700">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-700">
                    Payment
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-700">
                    Order Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-700">
                    Items
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {orders.map((order) => {
                  const isExpanded = expandedId === order.id;
                  const itemCount =
                    order.order_items?.reduce((s, i) => s + i.quantity, 0) || 0;
                  const orderStatus = order.order_status ?? "placed";

                  return (
                    <Fragment key={order.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          #{order.id.slice(0, 8)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(order.created_at).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          ₹
                          {Number(order.total).toLocaleString("en-IN", {
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={order.status}
                            onChange={(e) =>
                              updateOrderStatus(
                                order.id,
                                "status",
                                e.target.value,
                              )
                            }
                            disabled={updatingId === order.id}
                            aria-label={`Update payment status for order ${order.id.slice(0, 8)}`}
                            className={`rounded border px-2 py-0.5 text-xs font-medium ${
                              order.status === "paid"
                                ? "border-green-200 bg-green-50 text-green-800"
                                : order.status === "refunded"
                                  ? "border-purple-200 bg-purple-50 text-purple-800"
                                  : order.status === "failed" ||
                                      order.status === "cancelled"
                                    ? "border-red-200 bg-red-50 text-red-800"
                                    : "border-amber-200 bg-amber-50 text-amber-800"
                            }`}
                          >
                            {PAYMENT_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={orderStatus}
                            onChange={(e) =>
                              updateOrderStatus(
                                order.id,
                                "order_status",
                                e.target.value,
                              )
                            }
                            disabled={updatingId === order.id}
                            aria-label={`Update order status for order ${order.id.slice(0, 8)}`}
                            className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-800"
                          >
                            {ORDER_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {itemCount}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedId(isExpanded ? null : order.id)
                            }
                            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-1"
                            aria-label={
                              isExpanded
                                ? "Hide order details"
                                : "Show order details"
                            }
                            aria-expanded={isExpanded ? "true" : "false"}
                          >
                            <svg
                              className={`h-5 w-5 transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
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
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${order.id}-details`}>
                          <td colSpan={7} className="bg-gray-50 px-4 py-4">
                            <div className="space-y-4">
                              <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                                  Order Items
                                </h3>
                                <div className="space-y-2">
                                  {order.order_items?.map((item, idx) => {
                                    const itemTotal =
                                      parseFloat(
                                        item.price_at_order.toString(),
                                      ) * item.quantity;
                                    const imageUrls =
                                      (item.product?.image_urls as string[]) ||
                                      [];
                                    const imageUrl = imageUrls[0] || null;
                                    return (
                                      <div
                                        key={idx}
                                        className="flex items-center gap-4 rounded-lg bg-white p-3 border border-gray-100"
                                      >
                                        {imageUrl ? (
                                          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200">
                                            <Image
                                              src={imageUrl}
                                              alt={item.product?.name || ""}
                                              fill
                                              className="object-cover"
                                              sizes="48px"
                                            />
                                          </div>
                                        ) : (
                                          <div className="h-12 w-12 flex-shrink-0 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center">
                                            <span className="text-xs text-gray-400">
                                              —
                                            </span>
                                          </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium text-stone-900">
                                            {item.product?.name}
                                          </p>
                                          {item.variant && (
                                            <p className="text-sm text-stone-600">
                                              {item.variant.name}
                                            </p>
                                          )}
                                          <p className="text-sm text-stone-500">
                                            Qty: {item.quantity} × ₹
                                            {parseFloat(
                                              item.price_at_order.toString(),
                                            ).toLocaleString("en-IN", {
                                              maximumFractionDigits: 2,
                                            })}
                                          </p>
                                        </div>
                                        <p className="font-semibold text-stone-900">
                                          ₹
                                          {itemTotal.toLocaleString("en-IN", {
                                            maximumFractionDigits: 2,
                                          })}
                                        </p>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                              {order.address && (
                                <div>
                                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                                    Delivery Address
                                  </h3>
                                  <div className="rounded-lg bg-white p-3 border border-gray-100">
                                    <p className="text-stone-700">
                                      {order.address.line1}
                                    </p>
                                    <p className="text-stone-600">
                                      {order.address.city},{" "}
                                      {order.address.state}{" "}
                                      {order.address.pincode}
                                    </p>
                                    <p className="text-sm text-stone-600 mt-1">
                                      Phone: {order.address.phone}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing page {currentPage} of {totalPages}
                {pag && ` (${pag.total} orders)`}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="rounded border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="rounded border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
