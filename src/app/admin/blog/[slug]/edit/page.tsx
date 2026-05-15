import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BlogEditor } from '@/components/admin/BlogEditor';
import type { BlogPost } from '@/lib/blog-types';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditBlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="font-display text-[28px] leading-tight text-fg">
          Edit post
        </h1>
        <span className="font-micro text-[12px] uppercase tracking-[0.05em] text-fg-muted">
          /{data.slug}
        </span>
      </header>
      <BlogEditor post={data as BlogPost} mode="edit" />
    </div>
  );
}
