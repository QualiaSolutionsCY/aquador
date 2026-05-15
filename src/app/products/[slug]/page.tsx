import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import {
  getAllProductSlugs,
  getProductBySlug,
  getProductOrdersCount,
  getRelatedProducts,
} from '@/lib/supabase/product-service';
import ProductGallery from '@/components/storefront/ProductGallery';
import ProductNotesStory from '@/components/storefront/ProductNotesStory';
import RelatedCarousel from '@/components/storefront/RelatedCarousel';
import SocialProof from '@/components/storefront/SocialProof';
import TrustBar from '@/components/storefront/TrustBar';
import ProductActions from '@/components/storefront/ProductActions';
import { ProductViewTracker } from '@/components/products/ProductViewTracker';
import { formatPrice } from '@/lib/currency';
import type { Product } from '@/lib/supabase/types';

export const revalidate = 3600;

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

function getDisplayPrice(product: Product): number {
  return product.sale_price && product.sale_price < product.price
    ? product.sale_price
    : product.price;
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

// Generate metadata for SEO
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: 'Product Not Found | Aquad\'or',
    };
  }

  return {
    title: `${product.name}`,
    description: product.description,
    openGraph: {
      title: `${product.name} | Aquad'or`,
      description: product.description,
      url: `https://aquadorcy.com/products/${slug}`,
      images: [
        {
          url: product.image,
          width: 800,
          height: 800,
          alt: product.name,
        },
        ...(product.images ?? []).map((img: string) => ({
          url: img,
          width: 800,
          height: 800,
          alt: product.name,
        })),
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | Aquad'or`,
      description: product.description,
      images: [product.image],
    },
    alternates: {
      canonical: `https://aquadorcy.com/products/${slug}`,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const [relatedProducts, ordersCount] = await Promise.all([
    getRelatedProducts(product.id, product.category, 6),
    getProductOrdersCount(product.id, 30),
  ]);

  const productImages = product.images ?? [];
  const inStock = product.in_stock ?? true;
  const displayPrice = getDisplayPrice(product);
  const notes = splitNotes(product);

  // JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
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

          <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] lg:gap-16">
            <div className="min-w-0 px-[var(--page-px)] lg:pr-0">
              <ProductGallery images={buildImageList(product)} productName={product.name} />
            </div>

            <aside className="flex min-w-0 flex-col gap-8 px-[var(--page-px)] py-12 lg:sticky lg:top-28 lg:self-start lg:py-0">
              <header>
                {product.brand && (
                  <p className="font-micro text-[length:var(--font-size-micro)] uppercase tracking-[0.05em] text-fg-muted">
                    {product.brand}
                  </p>
                )}
                <h1 className="mt-3 font-display text-[length:var(--font-display-xl)] leading-[1.05] text-fg">
                  {product.name}
                </h1>
                <div className="mt-5 flex flex-wrap items-baseline gap-3">
                  <p className="font-display text-[length:var(--font-h2)] text-fg">
                    {formatPrice(displayPrice)}
                  </p>
                  {product.sale_price && product.sale_price < product.price && (
                    <p className="font-body text-[length:var(--font-size-body-sm)] text-fg-muted line-through">
                      {formatPrice(product.price)}
                    </p>
                  )}
                  <p className="font-micro text-[length:var(--font-size-micro)] uppercase tracking-[0.05em] text-fg-muted">
                    {product.size}
                  </p>
                </div>
              </header>

              <SocialProof ordersCount={ordersCount} />

              <div className="border-y border-border py-6">
                <ProductActions product={product} price={displayPrice} />
                <p className="mt-4 font-body text-[length:var(--font-size-body-sm)] text-fg-muted">
                  {inStock ? 'Prepared from the Nicosia desk.' : 'This bottle is resting before the next release.'}
                </p>
              </div>

              <TrustBar />

              <div className="grid gap-3 border-t border-border pt-6">
                <Link
                  href="/contact"
                  className="relative inline-flex min-h-11 w-full select-none items-center justify-center gap-2 whitespace-nowrap border border-border bg-bg-alt px-6 py-3 font-micro text-[12px] font-medium uppercase tracking-[0.05em] text-fg transition-all duration-150 ease-[cubic-bezier(0.25,1,0.5,1)] hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg active:translate-y-px"
                >
                  Order a 2ml sample
                </Link>
              </div>

              <aside className="border-t border-border pt-6">
                <p className="font-micro text-[length:var(--font-size-micro)] uppercase tracking-[0.05em] text-fg-muted">
                  Build your own
                </p>
                <h2 className="mt-2 font-display text-[length:var(--font-h3)] leading-tight text-fg">
                  Or make one. Three layers, four hours.
                </h2>
                <Link
                  href="/create-perfume"
                  className="group mt-4 inline-flex font-body text-[length:var(--font-size-body)] text-fg transition-colors duration-[var(--duration-fast)] hover:text-accent-deep"
                >
                  <span className="relative after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:bg-current after:transition-transform after:duration-[var(--duration-fast)] after:ease-[var(--ease-out-quart)] group-hover:after:translate-y-0.5">
                    Open the builder
                  </span>
                </Link>
              </aside>
            </aside>
          </div>

          <ProductNotesStory
            topNotes={notes.topNotes}
            heartNotes={notes.heartNotes}
            baseNotes={notes.baseNotes}
            fragranceFamily={getFragranceFamily(product)}
            description={product.description}
          />

          <RelatedCarousel products={relatedProducts} />
        </article>
      </main>
    </>
  );
}
