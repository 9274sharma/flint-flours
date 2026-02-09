import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/landing/Header";
import { ShopFilters } from "@/components/shop/ShopFilters";
import { ProductCard } from "@/components/shop/ProductCard";
import { BRAND_TO_SUB_BRAND } from "@/lib/constants";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function ShopPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  // Support both sub_brand (from filter UI) and brand (from Our Brands links)
  const brandParam =
    typeof params.brand === "string" ? params.brand : undefined;
  const subBrandParam =
    typeof params.sub_brand === "string" ? params.sub_brand : undefined;
  const subBrand =
    subBrandParam ||
    (brandParam ? BRAND_TO_SUB_BRAND[brandParam] : undefined);
  const category =
    typeof params.category === "string" ? params.category : undefined;
  const sort = typeof params.sort === "string" ? params.sort : "created_at";
  const order = typeof params.order === "string" ? params.order : "desc";

  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select(
      `
      id, 
      name, 
      slug, 
      category, 
      sub_brand, 
      image_urls,
      product_variants (
        id,
        name,
        slug,
        price,
        discount_percent,
        stock,
        shelf_life_days,
        is_active
      )
    `,
    )
    .eq("is_active", true);

  if (subBrand) query = query.eq("sub_brand", subBrand);
  if (category) query = query.eq("category", category);
  // Note: variant filtering will be handled client-side after fetching

  const validSort = ["created_at", "name"].includes(sort)
    ? sort
    : "created_at";
  const validOrder = order === "asc" ? "asc" : "desc";
  query = query.order(validSort, { ascending: validOrder === "asc" });

  const { data: products, error } = await query;

  type ProductRow = { id: string; product_variants?: { is_active: boolean }[] };
  const productsWithVariants = (products?.filter(
    (product: ProductRow) =>
      product.product_variants &&
      product.product_variants.length > 0 &&
      product.product_variants.some((v) => v.is_active === true)
  ) ?? []) as typeof products;

  return (
    <main className="min-h-screen bg-gradient-to-b from-cream-50 to-cream-100">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="font-serif text-3xl font-bold text-stone-850">Shop</h1>
        <p className="mt-2 text-stone-600">
          Discover our range of millet-based bakery and snacks.
        </p>
        <ShopFilters />
        <div className="mt-8">
          {error ? (
            <p className="text-amber-600">
              Unable to load products. Please try again.
            </p>
          ) : !productsWithVariants || productsWithVariants.length === 0 ? (
            <div className="rounded-xl border border-stone-200 bg-white/80 p-12 text-center">
              <p className="text-stone-600">No products found.</p>
              <p className="mt-2 text-sm text-stone-500">
                Try adjusting your filters or check back later.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {productsWithVariants.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
