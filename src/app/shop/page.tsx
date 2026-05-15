import { Metadata } from 'next';
import { Suspense } from 'react';
import { getAllProducts, getAllProductBrands } from '@/lib/supabase/product-service';
import { CATEGORY_OPTIONS } from '@/lib/constants';
import ProductGrid from '@/components/storefront/ProductGrid';
import ShopGridFallback from '@/components/storefront/ShopGridFallback';

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Dubai Shop | Aquad'or Cyprus, Luxury Fragrances",
  description: "Browse our curated Dubai collection of luxury perfumes, niche fragrances, and exclusive scents. Free shipping on orders over €35 in Cyprus.",
  openGraph: {
    title: "Dubai Shop | Aquad'or Cyprus",
    description: "Browse our curated Dubai collection of luxury perfumes and niche fragrances.",
    url: 'https://aquadorcy.com/shop',
    images: [{ url: '/aquador.webp', width: 800, height: 600, alt: "Aquad'or Perfume Collection" }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Dubai Shop | Aquad'or Cyprus",
    description: "Browse our curated Dubai collection of luxury perfumes and niche fragrances.",
    images: ['/aquador.webp'],
  },
  alternates: {
    canonical: 'https://aquadorcy.com/shop',
  },
};

export default async function ShopPage() {
  const [allProducts, brandOptions] = await Promise.all([
    getAllProducts(),
    getAllProductBrands(),
  ]);

  // Dubai Shop: exclude Lattafa (own page) and non-perfume types (oils/lotions are variants, not separate listings)
  const products = allProducts.filter(
    (p) => p.category !== 'lattafa-original' && p.product_type === 'perfume',
  );

  return (
    <main className="pt-32 md:pt-40 lg:pt-44 pb-20 bg-bg min-h-screen">
      <header className="border-b border-border pb-12 mb-12 px-[var(--page-px)]">
        <p className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted">
          Shop
        </p>
        <h1 className="font-display text-fg mt-2 text-[length:var(--font-display-2xl)] leading-[1.05]">
          The full collection
        </h1>
        <p className="text-fg-muted mt-4 max-w-prose text-[length:var(--font-size-body)]">
          Refine by category, brand, or price.
        </p>
      </header>
      <Suspense fallback={<ShopGridFallback />}>
        <ProductGrid
          products={products}
          brandOptions={brandOptions}
          categoryOptions={CATEGORY_OPTIONS}
        />
      </Suspense>
    </main>
  );
}
