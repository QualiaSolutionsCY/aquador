import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getProductBySlug, getRelatedProducts, getAllProductSlugs } from '@/lib/supabase/product-service';
import ProductDetails from '@/components/products/ProductDetails';
import RelatedProducts from '@/components/products/RelatedProducts';
import ProductGallery from '@/components/products/ProductGallery';
import ParallaxWrapper from './ParallaxWrapper';
import { ProductViewTracker } from '@/components/products/ProductViewTracker';

export const revalidate = 3600;

interface ProductPageProps {
  params: Promise<{ slug: string }>;
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

  const relatedProducts = await getRelatedProducts(product.id, product.category);

  const productImages = product.images ?? [];
  const inStock = product.in_stock ?? true;

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

      <main className="min-h-screen bg-gold-ambient pt-24 md:pt-28 lg:pt-32 pb-20">
        <div className="content-container">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-[11px] text-gold/50 uppercase tracking-[0.12em] hover:text-gold transition-colors duration-300"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Dubai Shop
            </Link>
          </nav>

          {/* Product Content — compact layout so CTA is above the fold */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-start">
            {/* Product Images - Subtle parallax for depth */}
            <ParallaxWrapper>
              <ProductGallery
                mainImage={product.image}
                images={productImages}
                name={product.name}
                inStock={inStock}
              />
            </ParallaxWrapper>

            {/* Product Details with variant selector + add to cart */}
            <div className="lg:sticky lg:top-28">
              <ProductDetails product={product} />
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <RelatedProducts products={relatedProducts} />
          )}
        </div>
      </main>
    </>
  );
}
