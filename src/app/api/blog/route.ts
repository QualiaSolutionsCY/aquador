import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { estimateReadTime, generateSlug } from '@/lib/blog';
import { z } from 'zod';

export const maxDuration = 10;

const blogPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required'),
  slug: z.string().max(200).optional(),
  excerpt: z.string().max(500).optional(),
  category: z.string().max(100).optional(),
  status: z.enum(['draft', 'published']).optional(),
  featured: z.boolean().optional(),
  cover_image: z.string().url().optional().nullable(),
  meta_title: z.string().max(200).optional(),
  meta_description: z.string().max(500).optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '9');
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const statusFilter = searchParams.get('status');
    const offset = (page - 1) * limit;

    const supabase = await createClient();

  let query = supabase
    .from('blog_posts')
    .select('*', { count: 'exact' });

  // Admin can request all posts; public only sees published
  if (statusFilter === 'all') {
    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();
      if (!adminUser) {
        query = query.eq('status', 'published');
      }
    } else {
      query = query.eq('status', 'published');
    }
  } else {
    query = query.eq('status', 'published');
  }

  query = query.order('created_at', { ascending: false });

  if (category) {
    query = query.eq('category', category);
  }

  if (featured === 'true') {
    query = query.eq('featured', true);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

    const response = NextResponse.json({
      posts: data,
      total: count,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    });
    if (statusFilter !== 'all') {
      response.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400');
    }
    return response;
  } catch (error) {
    console.error('Blog GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (!adminUser) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const result = blogPostSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message || 'Invalid blog post data' },
      { status: 400 }
    );
  }
  const postData = result.data;
  const slug = postData.slug || generateSlug(postData.title);
  const read_time = estimateReadTime(postData.content || '');

  const { data, error } = await supabase
    .from('blog_posts')
    .insert({
      ...postData,
      slug,
      read_time,
      published_at: postData.status === 'published' ? new Date().toISOString() : null,
    })
    .select()
    .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Blog POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
