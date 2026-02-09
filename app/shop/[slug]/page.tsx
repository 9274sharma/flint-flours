import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/landing/Header";
import { notFound } from "next/navigation";
import { ProductDetailClient } from "@/components/shop/ProductDetailClient";
import { ProductReviews } from "@/components/shop/ProductReviews";
import { ProductStructuredData } from "@/components/shop/ProductStructuredData";

type Props = { params: Promise<{ slug: string }> };

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: product, error } = await supabase
    .from("products")
    .select(
      `
      id, 
      name, 
      slug, 
      category, 
      sub_brand, 
      hsn_code,
      image_urls,
      product_variants (
        id,
        name,
        slug,
        description,
        price,
        discount_percent,
        stock,
        gst_percent,
        shelf_life_days,
        is_active
      )
    `
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !product) {
    notFound();
  }

  const activeVariants = product.product_variants?.filter(
    (v: { is_active: boolean }) => v.is_active
  ) || [];

  if (activeVariants.length === 0) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-cream-50 to-cream-100">
      <ProductStructuredData
        product={product}
        variants={activeVariants.map((v: { id: string; name: string; price: number; discount_percent?: number; stock?: number }) => ({
          id: v.id,
          name: v.name,
          price: v.price,
          discount_percent: v.discount_percent,
          stock: v.stock,
        }))}
      />
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <nav className="mb-6 text-sm text-stone-600" aria-label="Breadcrumb">
          <Link href="/shop" className="hover:text-stone-900">
            Shop
          </Link>
          <span className="mx-2">/</span>
          <span className="text-stone-900">{product.name}</span>
        </nav>

        <ProductDetailClient product={{ ...product, is_active: true }} />
        <ProductReviews productId={product.id} />
      </div>
    </main>
  );
}
