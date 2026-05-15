import { Suspense } from 'react';
import { Metadata } from 'next';
import { getFeaturedProducts } from '@/lib/supabase/product-service';
import Hero from '@/components/storefront/Hero';
import BrandMarquee from '@/components/storefront/BrandMarquee';
import NotesStory from '@/components/storefront/NotesStory';
import BrandStory from '@/components/storefront/BrandStory';
import JournalTeaser from '@/components/storefront/JournalTeaser';
import EmailCapture from '@/components/storefront/EmailCapture';
import AiConciergeEntry from '@/components/storefront/AiConciergeEntry';
import FeaturedGrid, {
  FeaturedGridSkeleton,
} from '@/components/storefront/FeaturedGrid';

export const metadata: Metadata = {
  title: "Aquad'or | Luxury Perfumes & Niche Fragrances Cyprus",
  description:
    "Where Luxury Meets Distinction. Discover our curated collection of high-end and niche perfumes, or create your own signature fragrance at Aquad'or Cyprus, Nicosia.",
  alternates: {
    canonical: 'https://aquadorcy.com',
  },
};

export const revalidate = 600;

async function fetchFeaturedSafe() {
  try {
    return await getFeaturedProducts(12);
  } catch {
    // Supabase unreachable or schema error: degrade gracefully to an empty
    // grid. The rest of the homepage (hero, editorial sections, email capture,
    // concierge) remains rendered. Logged server-side via Next instrumentation.
    return [];
  }
}

async function FeaturedGridLoader() {
  const products = await fetchFeaturedSafe();
  return <FeaturedGrid products={products} />;
}

export default function Home() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: "Aquad'or",
    url: 'https://aquadorcy.com',
    logo: 'https://aquadorcy.com/aquador.webp',
    description:
      "Cyprus's premier luxury fragrance house offering curated niche perfumes and bespoke fragrance creation.",
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Ledra 145',
      addressLocality: 'Nicosia',
      postalCode: '1011',
      addressCountry: 'CY',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+357-99-980809',
      contactType: 'customer service',
      email: 'info@aquadorcy.com',
      availableLanguage: ['English', 'Greek', 'Arabic'],
    },
    sameAs: [
      'https://instagram.com/aquadorcy',
      'https://facebook.com/aquadorcy',
    ],
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: "Aquad'or",
    url: 'https://aquadorcy.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://aquadorcy.com/shop?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: "Aquad'or",
    image: 'https://aquadorcy.com/aquador.webp',
    url: 'https://aquadorcy.com',
    telephone: '+357-99-980809',
    email: 'info@aquadorcy.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Ledra 145',
      addressLocality: 'Nicosia',
      postalCode: '1011',
      addressCountry: 'CY',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 35.1753,
      longitude: 33.3619,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '10:00',
        closes: '20:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Sunday',
        opens: '12:00',
        closes: '18:00',
      },
    ],
    priceRange: '€€',
  };

  // Safe JSON-LD serialization: escape </script> injection vector only
  const safeStringify = (obj: unknown) =>
    JSON.stringify(obj).replace(/<\/script>/gi, '<\\/script>');

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeStringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeStringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeStringify(localBusinessSchema) }}
      />
      <Hero />
      <BrandMarquee />
      <Suspense fallback={<FeaturedGridSkeleton />}>
        <FeaturedGridLoader />
      </Suspense>
      <NotesStory />
      <BrandStory />
      <JournalTeaser />
      <EmailCapture />
      <AiConciergeEntry />
    </>
  );
}
