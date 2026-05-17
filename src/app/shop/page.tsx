import { Metadata } from 'next';
import { Suspense } from 'react';
import { getAllProducts, getAllProductBrands } from '@/lib/supabase/product-service';
import { CATEGORY_OPTIONS } from '@/lib/constants';
import { buildPageMetadata } from '@/lib/seo/metadata';
import ProductGrid from '@/components/storefront/ProductGrid';
import ShopGridFallback from '@/components/storefront/ShopGridFallback';

export const revalidate = 60;

export const metadata: Metadata = buildPageMetadata({
  title: 'Dubai Shop',
  description:
    "The Dubai-sourced Aquad'or collection. Women, men, niche houses, and Al-Haramain originals. Refine by category, brand, or price.",
  path: '/shop',
  ogImage: '/og/shop.jpg',
});

export default async function ShopPage() {
  const [allProducts, brandOptions] = await Promise.all([
    getAllProducts(),
    getAllProductBrands(),
  ]);

  // Dubai Shop excludes Lattafa (own /shop/lattafa page) and non-perfume
  // product types (oils and lotions appear as variants on a perfume page,
  // not standalone listings).
  const products = allProducts.filter(
    (p) => p.category !== 'lattafa-original' && p.product_type === 'perfume',
  );

  // Category options must mirror the product set above — drop Lattafa so the
  // filter never offers a category that would yield zero matches.
  const categoryOptions = CATEGORY_OPTIONS.filter(
    (c) => c.id !== 'lattafa-original',
  );

  return (
    <main className="pt-32 md:pt-40 lg:pt-44 pb-20 bg-bg min-h-screen">
      <header className="border-b border-border pb-12 mb-2 px-[var(--page-px)]">
        <p className="font-micro uppercase tracking-[0.08em] text-[length:var(--font-size-micro)] text-fg-muted">
          The Collection
        </p>
        <h1 className="font-display text-fg mt-3 text-[length:var(--font-display-2xl)] leading-[1.05]">
          Dubai Shop
        </h1>
        <p className="text-fg-muted mt-4 max-w-prose text-[length:var(--font-size-body)]">
          Authentic Arabian fragrances sourced from the perfume capital of the
          Gulf. Refine by category, brand, gender, or price band.
        </p>
      </header>
      <Suspense fallback={<ShopGridFallback />}>
        <ProductGrid
          products={products}
          brandOptions={brandOptions}
          categoryOptions={categoryOptions}
        />
      </Suspense>
    </main>
  );
}
