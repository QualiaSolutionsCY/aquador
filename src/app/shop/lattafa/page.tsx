import { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getProductsByCategory, getAllProductBrands } from '@/lib/supabase/product-service';
import { CATEGORY_OPTIONS } from '@/lib/constants';
import ProductGrid from '@/components/storefront/ProductGrid';
import ShopGridFallback from '@/components/storefront/ShopGridFallback';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Lattafa Originals Perfumes',
  description: "Discover our original Lattafa Perfumes collection. Authentic Arabian fragrances crafted with the finest ingredients. Shop online at Aquad'or Cyprus.",
  openGraph: {
    title: "Lattafa Originals Perfumes | Aquad'or Cyprus",
    description: 'Authentic Arabian fragrances crafted with the finest ingredients. Original Lattafa Perfumes collection.',
    url: 'https://aquadorcy.com/shop/lattafa',
    images: [{ url: '/aquador.webp', width: 800, height: 600, alt: 'Lattafa Originals Perfumes' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Lattafa Originals Perfumes | Aquad'or Cyprus",
    description: 'Authentic Arabian fragrances. Original Lattafa Perfumes collection.',
    images: ['/aquador.webp'],
  },
  alternates: {
    canonical: 'https://aquadorcy.com/shop/lattafa',
  },
};

export default async function LattafaPage() {
  const [products, brandOptions] = await Promise.all([
    getProductsByCategory('lattafa-original'),
    getAllProductBrands(),
  ]);

  if (products.length === 0) {
    return (
      <main className="pt-32 md:pt-40 lg:pt-44 pb-20 bg-bg min-h-screen">
        <header className="border-b border-border-dark pb-12 mb-12 px-[var(--page-px)]">
          <p className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted">
            Shop / Lattafa Originals
          </p>
          <h1 className="font-display text-fg mt-2 text-[length:var(--font-display-2xl)] leading-[1.05]">
            The Lattafa collection is resting.
          </h1>
          <p className="text-fg-muted mt-4 max-w-prose text-[length:var(--font-size-body)]">
            Browse the full shop in the meantime.
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-flex min-h-[44px] items-center gap-2 font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-accent-deep underline-offset-4 transition-colors duration-[var(--duration-fast)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to shop
          </Link>
        </header>
      </main>
    );
  }

  return (
    <main className="pt-32 md:pt-40 lg:pt-44 pb-20 bg-bg min-h-screen">
      <header className="border-b border-border-dark pb-12 mb-2 px-[var(--page-px)]">
        <p className="font-micro uppercase tracking-[0.08em] text-[length:var(--font-size-micro)] text-fg-muted">
          The Collection / Lattafa
        </p>
        <h1 className="font-display text-fg mt-3 text-[length:var(--font-display-2xl)] leading-[1.05]">
          Lattafa Originals
        </h1>
        <p className="text-fg-muted mt-4 max-w-prose text-[length:var(--font-size-body)]">
          Authentic Arabian fragrances from the Lattafa house. Refine by brand,
          gender, or price band.
        </p>
      </header>
      <Suspense fallback={<ShopGridFallback />}>
        <ProductGrid
          products={products}
          brandOptions={brandOptions}
          categoryOptions={CATEGORY_OPTIONS}
          categorySlug="lattafa-original"
        />
      </Suspense>
    </main>
  );
}
