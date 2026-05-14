import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { getFeaturedProducts } from '@/lib/supabase/product-service';
import Hero from '@/components/home/Hero';
import Categories from '@/components/home/Categories';
import CreateSection from '@/components/home/CreateSection';
import CTASection from '@/components/home/CTASection';

export const metadata: Metadata = {
  title: "Aquad'or | Luxury Perfumes & Niche Fragrances Cyprus",
  description: "Where Luxury Meets Distinction. Discover our curated collection of high-end and niche perfumes, or create your own signature fragrance at Aquad'or Cyprus, Nicosia.",
  alternates: {
    canonical: 'https://aquadorcy.com',
  },
};

const FeaturedProducts = dynamic(() => import('@/components/home/FeaturedProducts'), {
  ssr: true,
});

export const revalidate = 600;

export default async function Home() {
  const featuredProducts = await getFeaturedProducts(6);

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: "Aquad'or",
    url: 'https://aquadorcy.com',
    logo: 'https://aquadorcy.com/aquador.webp',
    description: "Cyprus's premier luxury fragrance house offering curated niche perfumes and bespoke fragrance creation.",
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
      <Categories />
      <CreateSection />
      <FeaturedProducts products={featuredProducts} />
      <CTASection />
    </>
  );
}
