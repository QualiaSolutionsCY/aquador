import { test, expect } from '@playwright/test';
import { runAxe } from './_helpers/axe';
import { ANY_IN_STOCK_SLUG } from './fixtures/test-data';

/**
 * Phase 3 QA-01 — /api/checkout redirect to Stripe.
 *
 * CheckoutButton (src/components/cart/CheckoutButton.tsx:49) POSTs to
 * /api/checkout, reads { url } and assigns `window.location.href`. We
 * intercept the response to confirm 2xx + valid Stripe URL before the
 * navigation finishes; do NOT fill the hosted form (T3 will cover that).
 *
 * The route requires STRIPE_SECRET_KEY to mint a session. If absent we
 * skip with a GH-issue token so CI accountability is preserved.
 */

const HAS_STRIPE = Boolean(process.env.STRIPE_SECRET_KEY);

test.describe('Cart → checkout → Stripe redirect', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      try {
        localStorage.setItem('aquador_cookie_consent', 'accepted');
        const keys = Object.keys(localStorage);
        for (const k of keys) {
          if (k !== 'aquador_cookie_consent') localStorage.removeItem(k);
        }
      } catch {
        // ignore
      }
    });
  });

  test('Continue to checkout posts /api/checkout and redirects to Stripe', async ({
    page,
  }) => {
    test.skip(
      !HAS_STRIPE,
      'cart checkout requires STRIPE_SECRET_KEY in env to mint a Checkout Session — see GH issue #QA-STRIPE-KEY-CI',
    );

    await page.goto(`/products/${ANY_IN_STOCK_SLUG}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole('button', { name: 'Add to bag' }).first().click();

    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible({ timeout: 5_000 });

    // Axe BEFORE the Stripe redirect so we audit our own surface, not
    // checkout.stripe.com.
    await runAxe(page, 'checkout-precheckout');

    // Watch for the /api/checkout response before clicking. The button label
    // is "Continue to checkout" (CheckoutButton.tsx:113).
    const checkoutResponsePromise = page.waitForResponse(
      (r) => r.url().includes('/api/checkout') && r.request().method() === 'POST',
      { timeout: 20_000 },
    );

    await page
      .getByRole('button', { name: 'Continue to checkout', exact: true })
      .click();

    const checkoutResponse = await checkoutResponsePromise;
    expect(
      checkoutResponse.ok(),
      `/api/checkout should return 2xx; got ${checkoutResponse.status()}`,
    ).toBe(true);

    const body = (await checkoutResponse.json()) as { url?: string };
    expect(body.url, '/api/checkout should return a redirect url').toBeTruthy();
    expect(body.url!).toMatch(/checkout\.stripe\.com/);

    // Allow the JS-driven navigation to land. Cap at 10s.
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 10_000 });
    expect(page.url()).toMatch(/checkout\.stripe\.com/);
  });
});
