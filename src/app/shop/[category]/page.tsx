import { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import {
  getProductsByCategory,
  categories,
  getCategoryBySlug,
  getAllProductBrands,
} from '@/lib/supabase/product-service';
import { CATEGORY_OPTIONS } from '@/lib/constants';
import { buildPageMetadata } from '@/lib/seo/metadata';
import ProductGrid from '@/components/storefront/ProductGrid';
import ShopGridFallback from '@/components/storefront/ShopGridFallback';

export const revalidate = 60;

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

// Generate static params for all categories
export async function generateStaticParams() {
  return categories.map((category) => ({
    category: category.slug,
  }));
}

// Generate metadata for SEO via the per-route helper (M4 P2 T1).
export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const category = getCategoryBySlug(categorySlug);

  if (!category) {
    return buildPageMetadata({
      title: 'Category not found',
      description:
        "This category is unavailable. Browse the full Aquad’or collection, or open the journal for guidance on women, men, niche, and original houses.",
      path: `/shop/${categorySlug}`,
    });
  }

  return buildPageMetadata({
    title: category.name,
    description: category.description,
    path: `/shop/${categorySlug}`,
    ogImage: category.image || '/og/shop.jpg',
  });
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: categorySlug } = await params;
  const category = getCategoryBySlug(categorySlug);

  if (!category) {
    notFound();
  }

  const [allProducts, brandOptions] = await Promise.all([
    getProductsByCategory(categorySlug),
    getAllProductBrands(),
  ]);
  // Only show perfumes. Oils and lotions are variants on the product page, not separate listings.
  const products = allProducts.filter((p) => p.product_type === 'perfume');

  // BreadcrumbList structured data
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://aquadorcy.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Shop',
        item: 'https://aquadorcy.com/shop',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: category.name,
        item: `https://aquadorcy.com/shop/${categorySlug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema).replace(/</g, '\\u003c') }}
      />
      <main className="pt-32 md:pt-40 lg:pt-44 pb-20 bg-bg min-h-screen">
        <header className="border-b border-border-dark pb-12 mb-12 px-[var(--page-px)]">
          <p className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted">
            Shop / {category.name}
          </p>
          <h1 className="font-display text-fg mt-2 text-[length:var(--font-display-2xl)] leading-[1.05]">
            {category.name}
          </h1>
          <p className="text-fg-muted mt-4 max-w-prose text-[length:var(--font-size-body)]">
            {category.description}
          </p>
        </header>
        <Suspense fallback={<ShopGridFallback />}>
          <ProductGrid
            products={products}
            brandOptions={brandOptions}
            categoryOptions={CATEGORY_OPTIONS}
            categorySlug={categorySlug}
          />
        </Suspense>
      </main>
    </>
  );
}
