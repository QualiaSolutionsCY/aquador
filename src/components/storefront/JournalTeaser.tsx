/**
 * JournalTeaser. Third numbered editorial section on the homepage (HOME-02).
 *
 * Spec: .planning/DESIGN.md §10b "Numbered editorial sections". Fetches the
 * two most recent published blog posts and renders them as hairline-bordered
 * text-only containers (no cover image — owner preference). One post stacks
 * full width, two render side by side on md+.
 *
 * RSC; FadeUp is the single client boundary on the title block.
 *
 * Voice constants (locked, grepped by verifier):
 *   eyebrow: "03 / Letters"
 *   title:   "Recent letters from the desk."
 *   CTA:     "Read the journal"
 */

import Link from 'next/link';
import FadeUp from './FadeUp';
import { getBlogPosts } from '@/lib/blog';
import { formatBlogDate, type BlogPost } from '@/lib/blog-types';

async function loadRecentPosts(): Promise<BlogPost[]> {
  try {
    const { posts } = await getBlogPosts({ limit: 2 });
    return posts;
  } catch {
    return [];
  }
}

export default async function JournalTeaser() {
  const posts = await loadRecentPosts();

  return (
    <section className="border-t border-border-dark py-16 md:py-24 px-[var(--page-px)]">
      <FadeUp>
        <span aria-hidden="true" className="block h-px w-12 bg-border-strong" />
        <h2 className="mt-8 font-display text-fg leading-[1.1] tracking-[-0.01em] text-[length:var(--font-display-2xl)] max-w-[var(--container-prose)]">
          Recent letters from the desk.
        </h2>
      </FadeUp>

      <p className="mt-8 font-body text-fg-muted text-[length:var(--font-size-body-lg)] leading-relaxed max-w-[var(--container-narrow)]">
        Short essays on what we are wearing this week, why oud reads warmer in
        October, and how to choose a signature without trying every bottle in
        the city. New letters publish on Fridays.
      </p>

      {posts.length > 0 ? (
        <ul
          className={`mt-12 grid gap-px bg-border ${
            posts.length > 1 ? 'md:grid-cols-2' : ''
          } border border-border`}
        >
          {posts.map((post) => (
            <li key={post.id} className="bg-bg">
              <Link
                href={`/blog/${post.slug}`}
                className="group flex h-full flex-col p-8 md:p-10 transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out-quart)] hover:bg-bg-alt focus-visible:bg-bg-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
              >
                {post.category ? (
                  <p className="font-micro uppercase tracking-[0.16em] text-[length:var(--font-size-micro)] text-fg-muted">
                    {post.category}
                  </p>
                ) : null}
                <h3 className="mt-4 font-display text-fg leading-[1.15] tracking-[-0.01em] text-[length:var(--font-display-xl)] transition-colors duration-[var(--duration-fast)] group-hover:text-accent-deep">
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
                <p className="mt-auto pt-8 font-micro uppercase tracking-[0.08em] text-[length:var(--font-size-micro)] text-fg-muted">
                  <span className="relative inline-flex items-baseline gap-2 after:absolute after:left-0 after:-bottom-0.5 after:h-px after:w-full after:bg-current after:origin-left after:scale-x-100 after:transition-transform after:duration-[var(--duration-fast)] after:ease-[var(--ease-out-quart)] group-hover:after:scale-x-0">
                    Read the letter <span aria-hidden="true">→</span>
                  </span>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mt-12 font-body text-[length:var(--font-size-body)]">
        <Link
          href="/blog"
          className="group relative inline-flex items-baseline text-fg transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out-quart)] hover:text-accent-deep"
        >
          <span className="relative after:absolute after:left-0 after:-bottom-0.5 after:h-px after:w-full after:bg-current after:origin-left after:scale-x-100 after:transition-transform after:duration-[var(--duration-fast)] after:ease-[var(--ease-out-quart)] group-hover:after:scale-x-0">
            Read the journal
          </span>
        </Link>
      </p>
    </section>
  );
}
