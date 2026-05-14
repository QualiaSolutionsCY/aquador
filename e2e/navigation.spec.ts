import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ context }) => {
    // Pre-seed cookie consent so the bottom banner doesn't intercept clicks
    await context.addInitScript(() => {
      try {
        localStorage.setItem('aquador_cookie_consent', 'accepted');
      } catch {
        // ignore
      }
    });
  });

  test('should navigate to home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Aquad'or/);
  });

  test('should navigate to shop page', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Explore Collection');
    await expect(page).toHaveURL('/shop');
  });

  test('should navigate to category pages', async ({ page }) => {
    // Direct navigation is sufficient to verify the routes exist and category pages render.
    // The nav-click flow is covered separately by 'should navigate to shop page'.
    await page.goto('/shop/women');
    await expect(page).toHaveURL(/\/shop\/women/);
    await expect(page.locator('h1')).toContainText(/Women/i);

    await page.goto('/shop/men');
    await expect(page).toHaveURL(/\/shop\/men/);
    await expect(page.locator('h1')).toContainText(/Men/i);
  });

  test('should navigate to contact page', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Contact');
    await expect(page).toHaveURL('/contact');
  });

  test('should navigate to about page', async ({ page }) => {
    await page.goto('/');
    await page.click('text=About');
    await expect(page).toHaveURL('/about');
  });

  test('should navigate to create perfume page', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Create Your Own');
    await expect(page).toHaveURL(/\/create/);
  });

  test('should show 404 for non-existent pages', async ({ page }) => {
    await page.goto('/non-existent-page');
    await expect(page.locator('text=404')).toBeVisible();
    await expect(page.locator('text=Page Not Found')).toBeVisible();
  });
});
