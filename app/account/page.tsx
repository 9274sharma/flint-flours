import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/landing/Header";
import { LogoutButton } from "@/components/account/LogoutButton";
import { OrderItemCard } from "@/components/account/OrderItem";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account");
  }

  const [addressesResult, ordersResult, userRow, reviewsResult] = await Promise.all([
    supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select(
        `
        id,
        status,
        order_status,
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
          product_id,
          quantity,
          price_at_order,
          product:products (name, slug, image_urls),
          variant:product_variants (name, slug)
        )
      `,
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("users").select("role").eq("id", user.id).single(),
    supabase
      .from("reviews")
      .select("order_id, rating, comment")
      .eq("user_id", user.id),
  ]);

  const addresses = addressesResult.data ?? [];
  const isAdmin = userRow.data?.role === "admin";
  const rawOrders = ordersResult.data ?? [];

  // Transform Supabase response: product/variant may come as arrays from joins
  type RawOrderItem = {
    product_id: string;
    quantity: number;
    price_at_order: number;
    product: { name: string; slug: string; image_urls?: string[] | null } | { name: string; slug: string; image_urls?: string[] | null }[];
    variant?: { name: string; slug: string } | { name: string; slug: string }[];
  };
  type AddressRow = { line1: string; city: string; state: string; pincode: string; phone: string } | { line1: string; city: string; state: string; pincode: string; phone: string }[];
  const orders = rawOrders.map((o: { id: string; status: string; order_status?: string; total: number; created_at: string; address?: AddressRow; order_items?: RawOrderItem[] }) => ({
    ...o,
    address: o.address ? (Array.isArray(o.address) ? o.address[0] : o.address) : null,
    order_items: (o.order_items ?? []).map((item: RawOrderItem) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      price_at_order: item.price_at_order,
      product: Array.isArray(item.product) ? item.product[0] : item.product,
      variant: item.variant ? (Array.isArray(item.variant) ? item.variant[0] : item.variant) : undefined,
    })),
  }));

  const reviewsByOrder = (reviewsResult.data ?? []).reduce(
    (acc, r) => {
      acc[r.order_id] = { rating: r.rating, comment: r.comment };
      return acc;
    },
    {} as Record<string, { rating: number; comment: string | null }>
  );

  const displayName =
    (user.user_metadata?.full_name as string) ??
    (user.user_metadata?.name as string) ??
    user.email?.split("@")[0] ??
    "User";
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;

  return (
    <main className="min-h-screen bg-gradient-to-b from-cream-50 to-cream-100">
      <Header />
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="flex flex-col gap-8">
          {/* Profile section */}
          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="h-16 w-16 rounded-full border-2 border-stone-200 object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-200 text-xl font-semibold text-stone-600">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h1 className="font-serif text-2xl font-bold text-stone-850">
                    {displayName}
                  </h1>
                  <p className="mt-1 text-stone-600">{user.email}</p>
                  <p className="mt-1 text-sm text-stone-500">
                    Member since{" "}
                    {new Date(user.created_at).toLocaleDateString("en-IN", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-900"
                  >
                    Admin
                  </Link>
                )}
                <LogoutButton />
              </div>
            </div>
          </section>

          {/* Addresses section */}
          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-xl font-semibold text-stone-850">
              Saved addresses
            </h2>
            {addresses.length === 0 ? (
              <p className="mt-4 text-stone-500">
                No saved addresses yet. Add one at checkout.
              </p>
            ) : (
              <ul className="mt-4 space-y-4">
                {addresses.map((addr) => (
                  <li
                    key={addr.id}
                    className="rounded-lg border border-stone-100 bg-cream-50 p-4"
                  >
                    {addr.label && (
                      <span className="text-sm font-medium text-wheat-600">
                        {addr.label}
                      </span>
                    )}
                    <p className="mt-1 text-stone-700">{addr.line1}</p>
                    <p className="text-stone-600">
                      {addr.city}, {addr.state} – {addr.pincode}
                    </p>
                    <p className="mt-1 text-sm text-stone-600">
                      Phone: {addr.phone}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Order history */}
          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-xl font-semibold text-stone-850">
              Order history
            </h2>
            {orders.length === 0 ? (
              <p className="mt-4 text-stone-500">
                No orders yet.{" "}
                <Link href="/shop" className="text-wheat-600 hover:underline">
                  Start shopping
                </Link>
              </p>
            ) : (
              <ul className="mt-4 max-h-[calc(100dvh-18rem)] space-y-4 overflow-y-auto pr-1">
                {orders.map((order) => (
                  <OrderItemCard
                    key={order.id}
                    order={order}
                    reviewByOrder={reviewsByOrder[order.id]}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
