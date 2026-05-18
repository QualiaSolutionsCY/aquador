/**
 * JournalTeaser. Third numbered editorial section on the homepage (HOME-02).
 *
 * Spec: .planning/DESIGN.md §10b "Numbered editorial sections" + magazine
 * spread pattern. Now fetches the single featured post (or most recent if
 * none is flagged featured) and renders it as the visual right column —
 * cover image first, then meta + title + excerpt. Falls back to a text-only
 * teaser if no published post exists.
 *
 * RSC; FadeUp is the single client boundary on title/image blocks.
 *
 * Voice constants (locked, grepped by verifier):
 *   eyebrow: "03 / Letters"
 *   title:   "Recent letters from the desk."
 *   CTA:     "Read the journal"
 */

import Image from 'next/image';
import Link from 'next/link';
import FadeUp from './FadeUp';
import { getFeaturedPost, getBlogPosts } from '@/lib/blog';
import { formatBlogDate, type BlogPost } from '@/lib/blog-types';

async function loadFeaturedOrLatest(): Promise<BlogPost | null> {
  try {
    const featured = await getFeaturedPost();
    if (featured) return featured;
    const { posts } = await getBlogPosts({ limit: 1 });
    return posts[0] ?? null;
  } catch {
    return null;
  }
}

export default async function JournalTeaser() {
  const post = await loadFeaturedOrLatest();

  return (
    <section className="border-t border-border-dark py-16 md:py-24 px-[var(--page-px)] overflow-x-hidden">
      <div className="grid grid-cols-1 md:grid-cols-[40%_60%] gap-10 md:gap-12 lg:gap-16 items-start">
        {/* Left column: section header + intro copy + CTA */}
        <div>
          <FadeUp>
            <span aria-hidden="true" className="block h-px w-12 bg-border-strong" />
            <h2 className="mt-8 font-display text-fg leading-[1.1] tracking-[-0.01em] text-[length:var(--font-display-2xl)]">
              Recent letters from the desk.
            </h2>
          </FadeUp>

          <p className="mt-8 font-body text-fg-muted text-[length:var(--font-size-body-lg)] leading-relaxed max-w-[var(--container-narrow)]">
            Short essays on what we are wearing this week, why oud reads warmer
            in October, and how to choose a signature without trying every bottle
            in the city. New letters publish on Fridays.
          </p>

          <p className="mt-10 font-body text-[length:var(--font-size-body)]">
            <Link
              href="/blog"
              className="group relative inline-flex items-baseline text-fg transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out-quart)] hover:text-accent-deep"
            >
              <span className="relative after:absolute after:left-0 after:-bottom-0.5 after:h-px after:w-full after:bg-current after:origin-left after:scale-x-100 after:transition-transform after:duration-[var(--duration-fast)] after:ease-[var(--ease-out-quart)] group-hover:after:scale-x-0">
                Read the journal
              </span>
            </Link>
          </p>
        </div>

        {/* Right column: featured post as a magazine card. If no post is
            published yet, the right column stays empty rather than rendering
            a placeholder block. */}
        {post ? (
          <FadeUp className="md:mr-[calc(-1*var(--page-px))]">
            <Link
              href={`/blog/${post.slug}`}
              className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-bg-alt">
                {post.cover_image ? (
                  <Image
                    src={post.cover_image}
                    alt={post.title}
                    fill
                    sizes="(min-width: 768px) 60vw, 100vw"
                    className="object-cover transition-transform duration-[var(--duration-slow)] ease-[var(--ease-out-quart)] group-hover:scale-[1.02]"
                  />
                ) : null}
              </div>
              <div className="mt-6 max-w-[var(--container-narrow)]">
                {post.category ? (
                  <p className="font-micro uppercase tracking-[0.16em] text-[length:var(--font-size-micro)] text-fg-muted">
                    {post.category}
                  </p>
                ) : null}
                <h3 className="mt-4 font-display text-fg leading-[1.1] tracking-[-0.01em] text-[length:var(--font-display-xl)]">
                  {post.title}
                </h3>
                {post.excerpt ? (
                  <p className="mt-4 font-body text-fg-muted text-[length:var(--font-size-body)] leading-relaxed">
                    {post.excerpt}
                  </p>
                ) : null}
                <p className="mt-6 inline-flex items-baseline gap-3 font-micro uppercase tracking-[0.08em] text-[length:var(--font-size-micro)] text-fg-muted">
                  {post.published_at ? <span>{formatBlogDate(post.published_at)}</span> : null}
                  {post.read_time ? (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{post.read_time} min read</span>
                    </>
                  ) : null}
                </p>
              </div>
            </Link>
          </FadeUp>
        ) : null}
      </div>
    </section>
  );
}
