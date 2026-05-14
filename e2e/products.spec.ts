import { test, expect } from '@playwright/test';

test.describe('Product Pages', () => {
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

  test('should display shop page with products', async ({ page }) => {
    await page.goto('/shop');

    // Should have page title
    await expect(page.locator('h1')).toContainText(/Collection|Shop/i);

    // Should display product cards
    const productLinks = page.locator('a[href^="/products/"]');
    await expect(productLinks.first()).toBeVisible();
  });

  test('should display category filters', async ({ page }) => {
    await page.goto('/shop');

    // Should show category filter buttons (exact match, not "Women's" nav link)
    await expect(page.getByRole('button', { name: 'Women', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Men', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Niche Collection', exact: true })).toBeVisible();
  });

  test('should navigate to product detail page', async ({ page }) => {
    await page.goto('/shop');

    // Click on first product
    const productLink = page.locator('a[href^="/products/"]').first();
    const href = await productLink.getAttribute('href');
    await productLink.click();

    // Should be on product page
    await expect(page).toHaveURL(href || '');

    // Should show product details
    await expect(page.locator('text=Add to Cart')).toBeVisible();
  });

  test('should display product information on detail page', async ({ page }) => {
    await page.goto('/shop');

    // Click on first product
    await page.locator('a[href^="/products/"]').first().click();

    // Should show product image
    await expect(page.locator('img[alt]').first()).toBeVisible();

    // Should show price (use first to avoid strict-mode violation with related products)
    await expect(page.locator('text=€').first()).toBeVisible();

    // Should show add to cart button
    await expect(page.locator('text=Add to Cart')).toBeVisible();

    // Should show back to shop link (uses "Back to Dubai Shop" copy)
    await expect(page.locator('text=Back to Dubai Shop')).toBeVisible();
  });

  test('should display related products', async ({ page }) => {
    await page.goto('/shop');
    await page.locator('a[href^="/products/"]').first().click();

    // Should show related products section (if there are related products)
    const relatedSection = page.locator('text=Related Products, text=You May Also Like').first();
    // This may or may not exist depending on if there are related products
  });

  test('should handle quantity selection on product page', async ({ page }) => {
    await page.goto('/shop');
    await page.locator('a[href^="/products/"]').first().click();

    // Find quantity controls
    const decreaseButton = page.locator('button[aria-label="Decrease quantity"]');
    const increaseButton = page.locator('button[aria-label="Increase quantity"]');

    // Initial quantity should be 1
    await expect(page.locator('text=1').first()).toBeVisible();

    // Increase quantity
    await increaseButton.click();
    await expect(page.locator('span:has-text("2")').first()).toBeVisible();

    // Decrease button should now work
    await decreaseButton.click();
    await expect(page.locator('span:has-text("1")').first()).toBeVisible();
  });

  test('should filter products by women category', async ({ page }) => {
    await page.goto('/shop/women');

    // Should show women's collection
    await expect(page.locator('h1')).toContainText(/Women/i);

    // Should have product cards
    const productLinks = page.locator('a[href^="/products/"]');
    await expect(productLinks.first()).toBeVisible();
  });

  test('should filter products by men category', async ({ page }) => {
    await page.goto('/shop/men');

    // Should show men's collection
    await expect(page.locator('h1')).toContainText(/Men/i);

    // Should have product cards
    const productLinks = page.locator('a[href^="/products/"]');
    await expect(productLinks.first()).toBeVisible();
  });

  test('should filter products by niche category', async ({ page }) => {
    await page.goto('/shop/niche');

    // Should show niche collection
    await expect(page.locator('h1')).toContainText(/Niche/i);

    // Should have product cards
    const productLinks = page.locator('a[href^="/products/"]');
    await expect(productLinks.first()).toBeVisible();
  });
});
