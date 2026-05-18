import { Suspense } from 'react';
import { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { getFeaturedProducts } from '@/lib/supabase/product-service';
import Hero from '@/components/storefront/Hero';
import BrandMarquee from '@/components/storefront/BrandMarquee';
import Reviews from '@/components/storefront/Reviews';
import BrandStory from '@/components/storefront/BrandStory';
import JournalTeaser from '@/components/storefront/JournalTeaser';
import EmailCapture from '@/components/storefront/EmailCapture';
import AiConciergeEntry from '@/components/storefront/AiConciergeEntry';
import CategoryTriptych from '@/components/storefront/CategoryTriptych';
import RitualStrip from '@/components/storefront/RitualStrip';
import FeaturedGrid, {
  FeaturedGridSkeleton,
} from '@/components/storefront/FeaturedGrid';

export const metadata: Metadata = buildPageMetadata({
  title: "Aquad’or, niche and original fragrance in Cyprus",
  description:
    "Niche and original fragrance, plainly shown. Curated for the Levant, prepared from a Nicosia desk. Browse the catalogue or build a perfume in three layers.",
  path: '/',
  ogImage: '/og/home.jpg',
});

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
  // Organization + WebSite schemas now emit from src/app/layout.tsx so every
  // route carries them (M4 P2 T2, SEO-02). Only the homepage-scoped
  // LocalBusiness / Store schema lives here, because it describes the
  // storefront's physical presence which only `/` canonically represents.
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
        dangerouslySetInnerHTML={{ __html: safeStringify(localBusinessSchema) }}
      />
      {/* Section flow (M4 P1 polish, 2026-05-15): the page now reads as a
          narrative arc rather than a flat stack. Hero introduces the desk;
          BrandMarquee proves breadth; FeaturedGrid is the catalogue wall;
          CategoryTriptych converts "what is this?" into "which family?";
          NotesStory + RitualStrip pair the education with the brand promise;
          BrandStory + JournalTeaser deepen the why; AiConciergeEntry sits
          above EmailCapture so the high-intent conversion surface gets the
          attention, and the soft email capture closes the visit. */}
      <Hero />
      <BrandMarquee />
      <Suspense fallback={<FeaturedGridSkeleton />}>
        <FeaturedGridLoader />
      </Suspense>
      <CategoryTriptych />
      <Reviews />
      <RitualStrip />
      <BrandStory />
      <JournalTeaser />
      <AiConciergeEntry />
      <EmailCapture />
    </>
  );
}
