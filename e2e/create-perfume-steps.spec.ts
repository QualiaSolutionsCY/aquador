import { test, expect } from '@playwright/test';
import { runAxe } from './_helpers/axe';

/**
 * Phase 3 QA-01 — /create-perfume 5-step walkthrough up to the review step.
 *
 * Notes catalogue (src/lib/perfume/notes.ts): Bergamot+Lemon (fruity, top),
 * Rose+Jasmine+Ylang-Ylang (floral, heart), Oud+Sandalwood (woody/oriental,
 * base). Volume options: 50ml, 100ml (VolumeSelect.tsx).
 *
 * We stop BEFORE clicking "Continue to payment" so we do not hit Stripe
 * here — T1 in builder-and-concierge.spec.ts already exercises that.
 * This spec asserts the builder flow is reachable end-to-end + axe-clean
 * on the review screen.
 */

test.describe('Custom perfume builder /create-perfume', () => {
  test('walks Steps 1-5 to the review surface', async ({ page }) => {
    await page.goto('/create-perfume', { waitUntil: 'domcontentloaded' });

    await expect(
      page.getByRole('heading', { name: /Build a perfume/i, level: 1 }),
    ).toBeVisible({ timeout: 15_000 });

    // The note-picker section mounts at opacity-0 and fades in via an
    // IntersectionObserver (StepSelector.tsx:46-69). Use the inner <main>
    // (page.tsx:87) — `main.last()` skips the outer layout wrapper.
    const picker = page.locator('main').last();

    // Helper: click a note button and confirm aria-pressed flipped true.
    // Firefox occasionally drops the first click while the ancestor section
    // is still mid-fade; the polled wait + retry makes the toggle reliable
    // across all 5 browser projects.
    const toggleOn = async (name: string) => {
      const btn = picker.getByRole('button', { name, exact: true });
      await expect(btn).toBeVisible();
      for (let i = 0; i < 4; i++) {
        const pressed = await btn.getAttribute('aria-pressed');
        if (pressed === 'true') return;
        await btn.click();
        await page.waitForTimeout(150);
      }
      await expect(btn).toHaveAttribute('aria-pressed', 'true');
    };

    // Step 1: Top notes — Bergamot + Lemon (both fruity).
    await toggleOn('Bergamot');
    await toggleOn('Lemon');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();

    // Step 2: Heart notes — Rose + Jasmine + Ylang-Ylang.
    await expect(page.getByRole('heading', { name: /Heart notes/i })).toBeVisible();
    await toggleOn('Rose');
    await toggleOn('Jasmine');
    await toggleOn('Ylang-Ylang');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();

    // Step 3: Base notes — Oud + Sandalwood.
    await expect(page.getByRole('heading', { name: /Base notes/i })).toBeVisible();
    await toggleOn('Oud');
    await toggleOn('Sandalwood');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();

    // Step 4: Volume — 100ml. The label[for="volume-100ml"] pattern is the
    // same as builder-and-concierge.spec.ts (the underlying radio is hidden
    // for editorial styling so we click its label).
    await expect(page.getByRole('heading', { name: /How much/i })).toBeVisible();
    await page.locator('label[for="volume-100ml"]').click();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();

    // Step 5: Review surface ("Read it back"). Do NOT click the payment CTA.
    await expect(
      page.getByRole('heading', { name: /Read it back/i }),
    ).toBeVisible({ timeout: 5_000 });

    // The payment CTA must be present and enabled — proof that the canSubmit
    // gate flipped true after the selections above.
    const payCta = page.getByRole('button', { name: 'Continue to payment', exact: true });
    await expect(payCta).toBeVisible();
    await expect(payCta).toBeEnabled();

    await runAxe(page, 'create-perfume-review');
  });
});
