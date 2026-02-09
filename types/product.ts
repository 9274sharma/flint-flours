/**
 * Product variant - used in ProductCard, ProductDetailClient, FeaturedProductsSection
 */
export type ProductVariant = {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  price: number;
  discount_percent: number;
  stock: number;
  gst_percent?: number;
  shelf_life_days?: number | null;
  is_active: boolean;
};

/**
 * Product with variants - used in shop, featured products, product detail
 */
export type Product = {
  id: string;
  name: string;
  slug: string;
  category: string;
  sub_brand: string;
  hsn_code?: string | null;
  image_urls: string[] | null;
  is_active?: boolean;
  product_variants: ProductVariant[];
};
