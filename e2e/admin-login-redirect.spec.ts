import { test, expect } from '@playwright/test';

/**
 * Phase 3 QA-01 — Unauthenticated /admin is gated to /admin/login.
 *
 * src/middleware.ts:54 + :65 — middleware redirects every /admin/* request
 * that is not /admin/login (and is not authenticated) to /admin/login.
 *
 * We assert end-state, not intermediate HTTP status, because Next.js
 * middleware redirects are followed transparently by the browser.
 */

test.describe('Admin gate', () => {
  test('unauthenticated /admin redirects to /admin/login', async ({ page }) => {
    const response = await page.goto('/admin', { waitUntil: 'domcontentloaded' });

    // The final response should be 200 (the rendered login page) — the
    // intermediate 302 is consumed by the browser. Either way, the URL
    // must land on /admin/login.
    expect(response?.status() ?? 200).toBeLessThan(400);
    await expect(page).toHaveURL(/\/admin\/login(?:\?|$)/, { timeout: 10_000 });
  });
});
