import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBlogPostBySlug, getRelatedPosts } from '@/lib/blog';
import { buildPageMetadata } from '@/lib/seo/metadata';
import BlogPostContent from './BlogPostContent';

export const revalidate = 60; // Revalidate every 60 seconds (ISR)

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return buildPageMetadata({
      title: 'Journal entry not found',
      description:
        "This journal entry is unavailable. Open the journal index for current writing on fragrance, layering, and the houses we carry.",
      path: `/blog/${slug}`,
    });
  }

  // Prefer the editor-set meta_title / meta_description when present; fall back
  // to the post title + excerpt. Clip the title to 65 chars so the helper's
  // dev-time assertion never fires from a long editorial title.
  const rawTitle = post.meta_title || post.title;
  const safeTitle = rawTitle.length > 65 ? `${rawTitle.slice(0, 62)}...` : rawTitle;
  const description = post.meta_description || post.excerpt || `Read ${post.title} in the Aquad’or journal.`;

  return buildPageMetadata({
    title: safeTitle,
    description,
    path: `/blog/${post.slug}`,
    ogImage: post.cover_image || '/og/default.jpg',
  });
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = post.category
    ? await getRelatedPosts(post.category, post.slug)
    : [];

  // Build structured data array
  const schemas: Record<string, unknown>[] = [];

  // Article schema
  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || post.meta_description,
    image: post.cover_image,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: {
      '@type': 'Person',
      name: post.author_name,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Aquad\'or Cyprus',
      url: 'https://aquadorcy.com',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://aquadorcy.com/blog/${post.slug}`,
    },
  });

  // BreadcrumbList schema
  schemas.push({
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
        name: 'Blog',
        item: 'https://aquadorcy.com/blog',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: `https://aquadorcy.com/blog/${post.slug}`,
      },
    ],
  });

  // FAQPage schema - detect FAQ sections in content
  const faqMatches = post.content.match(
    /<details[^>]*>\s*<summary[^>]*>([\s\S]*?)<\/summary>\s*<div[^>]*>([\s\S]*?)<\/div>\s*<\/details>/gi
  );
  if (faqMatches && faqMatches.length > 0) {
    const faqItems = faqMatches.map((match) => {
      const questionMatch = match.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i);
      const answerMatch = match.match(/<div[^>]*>([\s\S]*?)<\/div>/i);
      return {
        '@type': 'Question',
        name: questionMatch?.[1]?.replace(/<[^>]*>/g, '').trim() || '',
        acceptedAnswer: {
          '@type': 'Answer',
          text: answerMatch?.[1]?.replace(/<[^>]*>/g, '').trim() || '',
        },
      };
    });

    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems,
    });
  }

  // LocalBusiness schema - detect store references
  if (post.content.includes('Ledra 145') || post.content.includes('Aquad\'or')) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      '@id': 'https://aquadorcy.com/#business',
      name: 'Aquad\'or',
      description: 'Cyprus\'s dedicated Arabian perfume boutique offering consultations, fragrance matching, and custom perfume creation.',
      url: 'https://aquadorcy.com',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Ledra 145',
        addressLocality: 'Nicosia',
        addressCountry: 'CY',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 35.1725,
        longitude: 33.3617,
      },
      priceRange: '$$',
      image: post.cover_image,
    });
  }

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
        />
      ))}
      <BlogPostContent post={post} relatedPosts={relatedPosts} />
    </>
  );
}
