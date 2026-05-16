/**
 * Per-page metadata helper (M4 P2 T1 / SEO-01, SEO-03 canonicals).
 *
 * One source of truth for every public route's <title>, <meta description>,
 * <link rel="canonical">, and OpenGraph + Twitter cards. The root layout at
 * `src/app/layout.tsx` already sets `metadataBase: new URL('https://aquadorcy.com')`,
 * so the `path` argument here is resolved against that base; pass relative
 * paths only ('/about', '/shop', '/products/some-slug'), not full URLs.
 *
 * Voice contract (DESIGN.md §10b, PRODUCT.md §Brand voice):
 *   - No em-dashes, no en-dashes, no emoji, no exclamation marks
 *   - Title ≤ 65 chars (helper throws in dev if violated)
 *   - Description 120-165 chars recommended (not enforced; copywriter discipline)
 */
import type { Metadata } from 'next';

export interface BuildPageMetadataInput {
  /** Page title. Must be ≤ 65 chars. The site-name suffix is appended by the
   * root layout's title template (`%s | Aquad'or Cyprus`) for non-root routes,
   * so pass the route-specific phrase here, not the full template result. */
  title: string;
  /** Meta description. Should be 120-165 chars in brand voice. */
  description: string;
  /** Absolute path on the site, leading slash required (e.g. '/about'). */
  path: string;
  /** Optional OG image override. Defaults to the brand fallback at
   *  '/og/default.jpg'. Pass a route-specific image (PDP hero, blog cover) when
   *  available so social shares carry the page's actual content. */
  ogImage?: string;
}

const SITE_NAME = "Aquad'or";
const LOCALE = 'en_CY';
const DEFAULT_OG_IMAGE = '/og/default.jpg';
const TITLE_MAX = 65;

/**
 * Build a Next `Metadata` object for a single route.
 *
 * Throws in development if `title` exceeds 65 chars so the violation is caught
 * before commit. In production the title is truncated to the limit to avoid
 * an unrecoverable runtime error mid-render.
 */
export function buildPageMetadata({
  title,
  description,
  path,
  ogImage,
}: BuildPageMetadataInput): Metadata {
  if (title.length > TITLE_MAX) {
    if (process.env.NODE_ENV === 'development') {
      throw new Error(
        `[buildPageMetadata] Title exceeds ${TITLE_MAX} chars (got ${title.length}): "${title}"`,
      );
    }
  }

  const safeTitle = title.length > TITLE_MAX ? title.slice(0, TITLE_MAX) : title;
  const image = ogImage ?? DEFAULT_OG_IMAGE;

  return {
    title: safeTitle,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: safeTitle,
      description,
      url: path,
      siteName: SITE_NAME,
      locale: LOCALE,
      type: 'website',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: safeTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: safeTitle,
      description,
      images: [image],
    },
  };
}
