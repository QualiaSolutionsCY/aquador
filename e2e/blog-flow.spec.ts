import { test, expect } from '@playwright/test';
import { runAxe } from './_helpers/axe';

/**
 * Phase 3 QA-01 — Blog index → post navigation.
 *
 * BlogCard (src/components/blog/BlogCard.tsx:24) wraps each post in
 * <Link href={`/blog/${post.slug}`}>. Catalogue has 10 published posts
 * (verified 2026-05-17 via Supabase). We assert ≥3 cards then drill
 * into the first.
 */

test.describe('Blog /blog', () => {
  test('index lists ≥3 posts; clicking the first lands on /blog/[slug]', async ({
    page,
  }) => {
    await page.goto('/blog', { waitUntil: 'domcontentloaded' });

    const postLinks = page.locator('a[href^="/blog/"]');
    // Wait for the list to materialise.
    await expect(postLinks.first()).toBeVisible({ timeout: 15_000 });

    const count = await postLinks.count();
    expect(
      count,
      `expected ≥3 blog post links on /blog, got ${count}`,
    ).toBeGreaterThanOrEqual(3);

    await runAxe(page, 'blog-index');

    const firstHref = await postLinks.first().getAttribute('href');
    expect(firstHref).toMatch(/^\/blog\/.+/);

    // Use a same-document navigation by waiting for URL change rather than
    // assuming a full load — the Link uses Next router prefetch.
    await postLinks.first().click();
    await page.waitForURL(/\/blog\/.+/, { timeout: 15_000 });

    // The post page must render an H1 (BlogPostContent).
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({
      timeout: 10_000,
    });

    await runAxe(page, 'blog-post');
  });
});
