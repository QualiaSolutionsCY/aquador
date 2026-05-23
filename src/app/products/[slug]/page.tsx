import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, PackageCheck } from 'lucide-react';
import {
  getAllProductSlugs,
  getProductBySlug,
  getProductOrdersCount,
  getProductVariantGroup,
  getRelatedProducts,
} from '@/lib/supabase/product-service';
import { buildPageMetadata } from '@/lib/seo/metadata';
import ProductGallery from '@/components/storefront/ProductGallery';
import ProductNotesStory from '@/components/storefront/ProductNotesStory';
import RelatedCarousel from '@/components/storefront/RelatedCarousel';
import SocialProof from '@/components/storefront/SocialProof';
import TrustBar from '@/components/storefront/TrustBar';
import ProductActions from '@/components/storefront/ProductActions';
import { ProductViewTracker } from '@/components/products/ProductViewTracker';
import type { Product } from '@/lib/supabase/types';
import { stripProductDescription } from '@/lib/product-description';

export const revalidate = 3600;

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

function buildImageList(product: Product) {
  const sources = [product.image, ...(product.images ?? [])].filter(Boolean);
  const uniqueSources = Array.from(new Set(sources));

  return uniqueSources.map((src, index) => ({
    src,
    alt: `${product.name}, fragrance detail ${index + 1}`,
  }));
}

function splitNotes(product: Product) {
  const rawNotes = (product.tags ?? [])
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 9);

  const fallback = [
    product.brand ?? "Aquad'or",
    product.category.replace(/-/g, ' '),
    product.product_type.replace(/-/g, ' '),
  ];

  const notes = rawNotes.length > 0 ? rawNotes : fallback;
  const third = Math.max(1, Math.ceil(notes.length / 3));

  return {
    topNotes: notes.slice(0, third),
    heartNotes: notes.slice(third, third * 2),
    baseNotes: notes.slice(third * 2),
  };
}

function getFragranceFamily(product: Product): string {
  if (product.tags?.[0]) return product.tags[0].toLowerCase();
  return product.category.replace(/-/g, ' ');
}

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

// Generate metadata for SEO via the per-route helper (M4 P2 T1). Title is the
// product name (safely truncated to the helper's 65-char cap if needed); OG
// image is the product hero with a brand-fallback for products without one.
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return buildPageMetadata({
      title: 'Product not found',
      description:
        "This bottle is no longer listed. Browse the rest of the catalogue or write to us at the Nicosia desk for a recommendation in the same family.",
      path: `/products/${slug}`,
    });
  }

  // Product names occasionally exceed 65 chars (long edition titles). Clip
  // server-side so the helper's dev-time assertion never fires from real data.
  const safeName = product.name.length > 65 ? `${product.name.slice(0, 62)}...` : product.name;

  const plainDescription = stripProductDescription(product.description);

  return buildPageMetadata({
    title: safeName,
    description: plainDescription,
    path: `/products/${slug}`,
    ogImage: product.image || '/og/default.jpg',
  });
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const [relatedProducts, ordersCount, productVariants] = await Promise.all([
    getRelatedProducts(product.id, product.category, 6),
    getProductOrdersCount(product.id, 30),
    getProductVariantGroup(product),
  ]);

  const productImages = product.images ?? [];
  const inStock = product.in_stock ?? true;
  const notes = splitNotes(product);
  const plainDescription = stripProductDescription(product.description, 260);

  // JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: plainDescription,
    image: [product.image, ...productImages],
    brand: product.brand ? {
      '@type': 'Brand',
      name: product.brand,
    } : undefined,
    offers: {
      '@type': 'Offer',
      url: `https://aquadorcy.com/products/${slug}`,
      priceCurrency: 'EUR',
      price: product.price,
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Aquad\'or',
      },
    },
  };

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
        name: 'Dubai Shop',
        item: 'https://aquadorcy.com/shop',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name,
        item: `https://aquadorcy.com/products/${slug}`,
      },
    ],
  };

  return (
    <>
      {/* Analytics: track time spent on product page (client-side, >3s threshold) */}
      <ProductViewTracker productSlug={slug} productName={product.name} />

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema).replace(/</g, '\\u003c') }}
      />

      <main className="min-h-screen bg-bg pb-24 pt-24 text-fg md:pb-0 md:pt-28 lg:pt-32">
        <article>
          <div className="mx-auto max-w-[var(--container-full)]">
          <div className="px-[var(--page-px)]">
            <nav className="mb-8" aria-label="Breadcrumb">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 font-micro text-[length:var(--font-size-micro)] uppercase tracking-[0.05em] text-fg-muted transition-colors duration-[var(--duration-fast)] hover:text-fg"
              >
                <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.5} />
                Back to Dubai Shop
              </Link>
            </nav>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-12">
            <div className="min-w-0 px-[var(--page-px)]">
              <ProductGallery images={buildImageList(product)} productName={product.name} />
            </div>

            <aside className="flex min-w-0 flex-col gap-6 px-[var(--page-px)] py-10 lg:sticky lg:top-28 lg:self-start lg:py-0">
              <header>
                {product.brand && (
                  <p className="font-micro text-[length:var(--font-size-micro)] uppercase tracking-[0.05em] text-fg-muted">
                    {product.brand}
                  </p>
                )}
                <h1 className="mt-3 font-display text-[length:var(--font-display-xl)] leading-[1.05] text-fg">
                  {product.name}
                </h1>
              </header>

              <div className="border-y border-border-dark bg-bg-alt/60 py-5">
                <div className="flex items-center justify-between gap-4 border-b border-border px-0 pb-5">
                  <SocialProof ordersCount={ordersCount} />
                  <span className="hidden font-micro uppercase tracking-[0.12em] text-[length:var(--font-size-micro)] text-fg-muted sm:inline">
                    {inStock ? 'Ready to pack' : 'Resting'}
                  </span>
                </div>
                <div className="pt-5">
                  <ProductActions product={product} variants={productVariants} />
                  <p className="mt-4 flex items-center gap-2 font-body text-[length:var(--font-size-body-sm)] text-fg-muted">
                    <PackageCheck aria-hidden className="h-4 w-4 text-accent-deep" strokeWidth={1.5} />
                    {inStock ? 'Prepared from the Nicosia desk.' : 'This bottle is resting before the next release.'}
                  </p>
                </div>
              </div>

              <TrustBar variant="panel" />

            </aside>
          </div>

          <ProductNotesStory
            topNotes={notes.topNotes}
            heartNotes={notes.heartNotes}
            baseNotes={notes.baseNotes}
            fragranceFamily={getFragranceFamily(product)}
            description={plainDescription}
          />

          <RelatedCarousel products={relatedProducts} />
          </div>
        </article>
      </main>
    </>
  );
}
