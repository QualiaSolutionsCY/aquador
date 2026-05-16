import { test, expect } from '@playwright/test';
import { runAxe } from './_helpers/axe';

/**
 * Phase 3 QA-01 — Shop filter + sort flow.
 *
 * Filter UX (src/components/storefront/FilterPanel.tsx): the Category
 * "chip"-style affordance is a radio inside an OptionRow label. Clicking
 * the row toggles the filter via the URL. Active filters then surface as
 * `<Tag>` chips at the top of the panel (line ~293), but the entry point
 * remains the radio row.
 *
 * Sort UX (src/components/storefront/SortControl.tsx): a Radix Tabs row
 * with options "Featured", "Price low to high", "Price high to low",
 * "Newest" (src/lib/constants.ts:67-72).
 */

test.describe('Shop /shop — filter + sort', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      try {
        localStorage.setItem('aquador_cookie_consent', 'accepted');
      } catch {
        // ignore
      }
    });
  });

  test('applies category filter and price-asc sort, prices non-decreasing', async ({
    page,
  }) => {
    await page.goto('/shop', { waitUntil: 'domcontentloaded' });

    // Wait for the grid to render its first card so we have a baseline count.
    const cards = page.locator('a[href^="/products/"]');
    await expect(cards.first()).toBeVisible({ timeout: 15_000 });
    const beforeCount = await cards.count();

    // Apply the Women category filter. The Category accordion is open by
    // default (FilterPanel.tsx:328 defaultOpen). Click the radio's row by
    // its label text.
    const womenRadio = page.locator('label[for="category-women"]');
    await womenRadio.click();

    // URL contract: `?category=women` written via router.replace in
    // ProductGrid.tsx:92-98 inside a useTransition.
    await expect(page).toHaveURL(/[?&]category=women(?:&|$)/, { timeout: 5_000 });

    // Grid count changes (filter narrows). Allow the IntersectionObserver
    // fade-up to settle before measuring.
    await expect
      .poll(async () => cards.count(), { timeout: 10_000 })
      .not.toBe(beforeCount);

    // Switch sort to "Price low to high". SortControl is a Radix Tabs row.
    await page.getByRole('tab', { name: 'Price low to high', exact: true }).click();
    await expect(page).toHaveURL(/[?&]sort=price-asc(?:&|$)/, { timeout: 5_000 });

    // First three visible prices must be non-decreasing. ProductCard prints
    // formatted euro text; we extract numeric values from rendered "€NN.NN"
    // strings inside the card links.
    await expect.poll(
      async () => {
        const prices = await page.evaluate(() => {
          const anchors = Array.from(
            document.querySelectorAll<HTMLAnchorElement>('a[href^="/products/"]'),
          ).slice(0, 3);
          const out: number[] = [];
          for (const a of anchors) {
            const text = a.textContent || '';
            const matches = text.match(/€\s*([0-9]+(?:[.,][0-9]+)?)/g) || [];
            if (matches.length > 0) {
              // Take the LAST euro figure in the card — sale price wins when
              // the card prints both an original and a sale price.
              const last = matches[matches.length - 1];
              const num = parseFloat(last.replace(/[^0-9.,]/g, '').replace(',', '.'));
              if (Number.isFinite(num)) out.push(num);
            }
          }
          return out;
        });
        return prices.length >= 3 ? prices : null;
      },
      { timeout: 10_000 },
    ).not.toBeNull();

    const prices: number[] = await page.evaluate(() => {
      const anchors = Array.from(
        document.querySelectorAll<HTMLAnchorElement>('a[href^="/products/"]'),
      ).slice(0, 3);
      const out: number[] = [];
      for (const a of anchors) {
        const text = a.textContent || '';
        const matches = text.match(/€\s*([0-9]+(?:[.,][0-9]+)?)/g) || [];
        if (matches.length > 0) {
          const last = matches[matches.length - 1];
          const num = parseFloat(last.replace(/[^0-9.,]/g, '').replace(',', '.'));
          if (Number.isFinite(num)) out.push(num);
        }
      }
      return out;
    });

    expect(prices.length, `expected ≥3 priced cards, got ${prices.length}`).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < prices.length; i++) {
      expect(
        prices[i],
        `prices should be non-decreasing under price-asc; got ${prices.join(', ')}`,
      ).toBeGreaterThanOrEqual(prices[i - 1]);
    }

    await runAxe(page, 'shop');
  });
});
