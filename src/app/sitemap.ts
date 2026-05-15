import { MetadataRoute } from 'next';
import { createPublicClient } from '@/lib/supabase/public';
import { getAllProductSlugs } from '@/lib/supabase/product-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://aquadorcy.com';

  // Static pages
  const staticRoutes = [
    { route: '', priority: 1, changeFrequency: 'weekly' as const },
    { route: '/shop', priority: 0.9, changeFrequency: 'daily' as const },
    { route: '/shop/women', priority: 0.8, changeFrequency: 'daily' as const },
    { route: '/shop/men', priority: 0.8, changeFrequency: 'daily' as const },
    { route: '/shop/niche', priority: 0.8, changeFrequency: 'daily' as const },
    { route: '/shop/lattafa', priority: 0.8, changeFrequency: 'daily' as const },
    { route: '/create-perfume', priority: 0.8, changeFrequency: 'weekly' as const },
    { route: '/reorder', priority: 0.7, changeFrequency: 'monthly' as const },
    { route: '/blog', priority: 0.8, changeFrequency: 'daily' as const },
    { route: '/about', priority: 0.6, changeFrequency: 'monthly' as const },
    { route: '/contact', priority: 0.6, changeFrequency: 'monthly' as const },
    { route: '/privacy', priority: 0.3, changeFrequency: 'yearly' as const },
    { route: '/terms', priority: 0.3, changeFrequency: 'yearly' as const },
    { route: '/shipping', priority: 0.5, changeFrequency: 'monthly' as const },
  ];

  const staticPages = staticRoutes.map(({ route, priority, changeFrequency }) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));

  // Product pages
  const productSlugs = await getAllProductSlugs();
  const productPages = productSlugs.map((slug) => ({
    url: `${baseUrl}/products/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Blog posts - use a cookie-free client since sitemap has no request context
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const supabase = createPublicClient();
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('slug, published_at, updated_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(100);

    if (posts) {
      blogPages = posts.map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(post.updated_at || post.published_at || new Date().toISOString()),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));
    }
  } catch (error) {
    const Sentry = await import('@sentry/nextjs');
    Sentry.addBreadcrumb({
      category: 'sitemap',
      message: 'Sitemap: Failed to fetch blog posts',
      level: 'error',
      data: { error }
    });
  }

  return [...staticPages, ...productPages, ...blogPages];
}
