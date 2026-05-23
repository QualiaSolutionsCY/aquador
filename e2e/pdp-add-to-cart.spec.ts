import { test, expect } from '@playwright/test';
import { runAxe } from './_helpers/axe';
import { ANY_IN_STOCK_SLUG } from './fixtures/test-data';

/**
 * Phase 3 QA-01 — PDP → add-to-cart → drawer flow.
 *
 * UX contract:
 *  - Button label is "Add to bag" (src/components/storefront/ProductActions.tsx:46
 *    desktop, StickyATC.tsx:48 mobile). On desktop the sticky is `md:hidden`;
 *    on mobile the desktop button is `hidden md:block`, so .first() resolves
 *    deterministically per viewport.
 *  - Drawer header copy is "Bag" (CartDrawer.tsx:62), not "Your Cart".
 *  - Radix Dialog (the Drawer primitive) closes on Escape by default.
 */

test.describe('PDP → Add to cart → drawer', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      try {
        localStorage.setItem('aquador_cookie_consent', 'accepted');
        // Start every test from a clean cart so the icon count assertion is
        // deterministic.
        const keys = Object.keys(localStorage);
        for (const k of keys) {
          if (k !== 'aquador_cookie_consent') localStorage.removeItem(k);
        }
      } catch {
        // ignore — storage may not be ready in some contexts
      }
    });
  });

  test('adding from PDP opens drawer with one item, Escape closes', async ({
    page,
  }) => {
    await page.goto(`/products/${ANY_IN_STOCK_SLUG}`, { waitUntil: 'domcontentloaded' });

    // Capture the displayed name (H1) and a euro price string from the page
    // chrome so we can assert both surface in the drawer.
    const h1 = page.getByRole('heading', { level: 1 }).first();
    await expect(h1).toBeVisible({ timeout: 15_000 });
    const productName = (await h1.textContent())?.trim() || '';
    expect(productName.length, 'product name should be non-empty').toBeGreaterThan(0);

    // Add to bag. Two buttons exist per PDP — the desktop ProductActions
    // button (hidden md:block) and the StickyATC bottom-fixed bar
    // (md:hidden). Scope explicitly to whichever is visible at this
    // viewport. On Mobile Chrome the sticky bar can overlap related-product
    // chrome at certain scroll positions; scroll to bottom of the document
    // first to keep it clear of overlay z-index.
    await runAxe(page, 'pdp');
    const desktopBtn = page
      .locator('.hidden.md\\:block')
      .getByRole('button', { name: 'Add to bag' });
    const desktopVisible = await desktopBtn.isVisible().catch(() => false);
    if (desktopVisible) {
      await desktopBtn.click();
    } else {
      // Mobile: StickyATC is `position:fixed` at viewport bottom with z-40.
      // Playwright's pointer-event-intercept check rejects clicks when ANY
      // element overlaps the target's center — even an offscreen one in
      // page-flow. Force the click; the StickyATC button is the genuine
      // user-tappable target on this viewport (md:hidden makes it the only
      // "Add to bag" affordance the user can see).
      const stickyBtn = page
        .locator('.storefront-sticky-atc')
        .getByRole('button', { name: 'Add to bag' });
      await stickyBtn.click({ force: true });
    }

    // Drawer opens with header "Bag" (CartDrawer.tsx:62).
    const drawerTitle = page.getByRole('heading', { name: 'Bag', exact: true });
    await expect(drawerTitle).toBeVisible({ timeout: 5_000 });

    // Cart icon reflects 1 item (CartIcon.tsx:15 aria-label is
    // "Shopping cart with N items"). May exist twice (desktop + mobile nav).
    await expect(
      page.locator('[aria-label="Shopping cart with 1 items"]').first(),
    ).toBeVisible();

    // Drawer contains the product name. The product name renders inside a
    // CartItem row; scoping to the drawer surface avoids matching the PDP H1.
    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText(productName.split('\n')[0]);

    // Drawer contains a euro price (formatted via formatPrice). We do not
    // pin a specific value because sale/regular pricing can shift; we only
    // assert a "€NN" pattern is present in the drawer body.
    await expect(drawer.locator('text=/€\\s*[0-9]/').first()).toBeVisible();

    // Escape closes the drawer (Radix Dialog behaviour).
    await page.keyboard.press('Escape');
    await expect(drawerTitle).not.toBeVisible({ timeout: 5_000 });
  });

  test("Aquad'or house PDP exposes synced perfume, oil, and lotion choices", async ({ page }) => {
    await page.goto('/products/pure-musk', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { level: 1, name: 'Pure Musk' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Perfume' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Essence Oil' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Body Lotion' })).toBeVisible();
    await expect(page.getByRole('button', { name: /50ml/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /100ml\s+€49\.99/ })).toBeVisible();

    await page.getByRole('button', { name: 'Essence Oil' }).click();
    await expect(page.getByRole('button', { name: /10ml\s+€19\.99/ })).toBeVisible();

    await page.getByRole('button', { name: 'Body Lotion' }).click();
    await expect(page.getByRole('button', { name: /150ml\s+€29\.99/ })).toBeVisible();
  });
});
