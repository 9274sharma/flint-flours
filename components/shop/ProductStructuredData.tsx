type ProductStructuredDataProps = {
  product: {
    id: string;
    name: string;
    slug: string;
    category: string;
    sub_brand: string;
    image_urls?: string[] | null;
  };
  variants: Array<{
    id: string;
    name: string;
    price: number;
    discount_percent?: number;
    stock?: number;
  }>;
};

const DEFAULT_SITE_URL = "https://www.flintandflours.com";

export function ProductStructuredData({
  product,
  variants,
}: ProductStructuredDataProps) {
  const lowestVariant = variants.reduce((min, v) =>
    v.price < min.price ? v : min
  );
  const price = lowestVariant.price * (1 - (lowestVariant.discount_percent ?? 0) / 100);
  const imageUrl = product.image_urls?.[0];
  const hasStock = variants.some((v) => (v.stock ?? 0) > 0);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: `${product.name} - ${product.category} by ${product.sub_brand}`,
    sku: product.id,
    category: product.category,
    brand: {
      "@type": "Brand",
      name: product.sub_brand,
    },
    offers: {
      "@type": "Offer",
      url: `${baseUrl}/shop/${product.slug}`,
      priceCurrency: "INR",
      price,
      availability: hasStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    ...(imageUrl && {
      image: imageUrl.startsWith("http") ? imageUrl : undefined,
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
