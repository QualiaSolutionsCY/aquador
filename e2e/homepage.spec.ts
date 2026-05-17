import { test, expect, type ConsoleMessage } from '@playwright/test';
import { runAxe } from './_helpers/axe';

/**
 * Phase 3 QA-01 — Homepage smoke + axe baseline.
 *
 * The hero H1 is rendered by src/components/storefront/Hero.tsx:149 and
 * spans three lines: "Perfume," / "curated in" / "Nicosia." The accessible
 * name therefore matches /Nicosia/.
 */

test.describe('Homepage', () => {
  test('hero renders and the page is axe-clean at critical', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg: ConsoleMessage) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Filter known-benign Next.js dev-server / 3rd-party loader noise.
        // The CSP / eval messages below are emitted ONLY in `next dev`
        // (React's development bundle uses eval; va.vercel-scripts is
        // blocked by our prod-grade CSP). Production builds don't surface
        // any of these — Lighthouse runs (Task 2) cover the real prod
        // CSP audit; this spec only proves the homepage renders.
        if (
          text.includes('Download the React DevTools') ||
          text.includes('hot-update') ||
          text.includes('Failed to load resource') ||
          text.includes('eval() is not supported') ||
          text.includes('React will never use eval()') ||
          text.includes('va.vercel-scripts.com') ||
          text.includes('Content Security Policy directive') ||
          // Firefox CSP wording differs from Chromium/WebKit.
          text.includes('Content-Security-Policy:') ||
          text.includes("Missing 'unsafe-eval'") ||
          text.includes('Missing ‘unsafe-eval’') ||
          // WebKit prints "Refused to load" for the same blocked scripts.
          text.includes('Refused to load the script')
        ) {
          return;
        }
        consoleErrors.push(text);
      }
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const h1 = page.getByRole('heading', { level: 1 }).first();
    await expect(h1).toBeVisible({ timeout: 15_000 });
    await expect(h1).toContainText(/Nicosia/i);

    await runAxe(page, 'home');

    expect(
      consoleErrors,
      `unexpected console errors on /: ${consoleErrors.join('\n')}`,
    ).toEqual([]);
  });
});
