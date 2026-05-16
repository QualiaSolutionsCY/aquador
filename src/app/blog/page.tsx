import { Metadata } from 'next';
import { getBlogPosts, getBlogCategories, getFeaturedPost } from '@/lib/blog';
import { buildPageMetadata } from '@/lib/seo/metadata';
import BlogListContent from './BlogListContent';

export const revalidate = 60; // Revalidate every 60 seconds (ISR)

export const metadata: Metadata = buildPageMetadata({
  title: 'Journal',
  description:
    "Stories from the desk. Slow guides to fragrance pyramids, layering, ingredient sourcing, and the Levant houses we carry at Aquad’or Cyprus.",
  path: '/blog',
});

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const params = await searchParams;
  const category = params.category || undefined;
  const page = parseInt(params.page || '1');

  const [{ posts, totalPages }, categories, featuredPost] = await Promise.all([
    getBlogPosts({ page, category }),
    getBlogCategories(),
    !category && page === 1 ? getFeaturedPost() : Promise.resolve(null),
  ]);

  return (
    <BlogListContent
      posts={posts}
      categories={categories}
      featuredPost={featuredPost}
      currentPage={page}
      totalPages={totalPages}
      activeCategory={category || null}
    />
  );
}
