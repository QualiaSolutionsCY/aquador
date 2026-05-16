/**
 * JSON-LD schema builders for site-wide structured data.
 *
 * The Organization + WebSite schemas describe Aquad'or as a business and as a
 * website with a search action. They emit on every route via the root layout
 * (src/app/layout.tsx) so Googlebot landing on a PDP, blog post, or any deep
 * link first sees the org context that Product / Article schemas compose with.
 *
 * Homepage-scoped schemas (LocalBusiness / Store) stay on src/app/page.tsx
 * because they describe the storefront's physical presence, which only the
 * `/` URL canonically represents.
 *
 * These helpers return plain JS objects (no `<script>` wrapper) so callers
 * control serialization and the XSS-escape pattern (`.replace(/</g, '\\u003c')`
 * or the `</script>` injection guard used in src/app/page.tsx).
 */

export function organizationJsonLd() {
  return {
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
  } as const;
}

export function websiteJsonLd() {
  return {
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
  } as const;
}
