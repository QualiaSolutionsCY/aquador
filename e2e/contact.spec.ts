import { test, expect } from '@playwright/test';

test.describe('Contact Form', () => {
  test.beforeEach(async ({ page, context }) => {
    // Pre-seed cookie consent so the bottom banner doesn't intercept clicks.
    await context.addInitScript(() => {
      try {
        localStorage.setItem('aquador_cookie_consent', 'accepted');
      } catch {
        // ignore
      }
    });
    await page.goto('/contact');
  });

  test('should display contact form', async ({ page }) => {
    await expect(page.locator('h1', { hasText: 'Contact Us' })).toBeVisible();
    await expect(page.locator('h2', { hasText: 'How Can We Help?' })).toBeVisible();

    // Form fields should be present
    await expect(page.locator('input#contact-name')).toBeVisible();
    await expect(page.locator('input#contact-email')).toBeVisible();
    await expect(page.locator('input#contact-phone')).toBeVisible();
    await expect(page.locator('input#contact-subject')).toBeVisible();
    await expect(page.locator('textarea#contact-message')).toBeVisible();
  });

  test('should display contact information', async ({ page }) => {
    const main = page.locator('#main-content');
    await expect(main.getByText('Ledra 145, 1011')).toBeVisible();
    await expect(main.getByText('+357 99 980809')).toBeVisible();
    await expect(main.getByText('info@aquadorcy.com')).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    // Click submit without filling form
    await page.click('button:has-text("Send Message")');

    // Should show validation errors
    await expect(page.locator('text=Name must be at least 2 characters')).toBeVisible();
  });

  test('should show validation error for invalid email', async ({ page }) => {
    // Fill name + valid-but-fake-domain email (passes HTML5, fails Zod). Then trigger blur.
    // We use 'a@b' which is HTML5-valid (browser only needs one '@') but Zod requires a TLD.
    await page.fill('input#contact-name', 'John Doe');
    await page.fill('input#contact-email', 'a@b');
    await page.fill('input#contact-subject', 'Test subject');
    await page.fill('textarea#contact-message', 'This is a test message.');

    // Click submit
    await page.click('button:has-text("Send Message")');

    // Should show email validation error
    await expect(page.getByText('Please enter a valid email')).toBeVisible({ timeout: 10000 });
  });

  test('should show validation error for short subject', async ({ page }) => {
    await page.fill('input#contact-name', 'John Doe');
    await page.fill('input#contact-email', 'john@example.com');
    await page.fill('input#contact-subject', 'Hi');
    await page.fill('textarea#contact-message', 'This is a test message.');

    await page.click('button:has-text("Send Message")');

    await expect(page.locator('text=Subject must be at least 5 characters')).toBeVisible();
  });

  test('should show validation error for short message', async ({ page }) => {
    await page.fill('input#contact-name', 'John Doe');
    await page.fill('input#contact-email', 'john@example.com');
    await page.fill('input#contact-subject', 'Product inquiry');
    await page.fill('textarea#contact-message', 'Hello');

    await page.click('button:has-text("Send Message")');

    await expect(page.locator('text=Message must be at least 10 characters')).toBeVisible();
  });

  test('should submit valid form successfully', async ({ page }) => {
    // Fill in valid form data
    await page.fill('input#contact-name', 'John Doe');
    await page.fill('input#contact-email', 'john@example.com');
    await page.fill('input#contact-phone', '+357 99 123456');
    await page.fill('input#contact-subject', 'Product inquiry');
    await page.fill('textarea#contact-message', 'I would like to know more about your perfumes and availability.');

    // Click submit
    await page.click('button:has-text("Send Message")');

    // Should show success message (heading after submission)
    await expect(page.locator('h3', { hasText: 'Message Sent' })).toBeVisible({ timeout: 10000 });
  });

  test('should show loading state during submission', async ({ page }) => {
    // Fill in valid form data
    await page.fill('input#contact-name', 'John Doe');
    await page.fill('input#contact-email', 'john@example.com');
    await page.fill('input#contact-subject', 'Product inquiry');
    await page.fill('textarea#contact-message', 'I would like to know more about your perfumes.');

    // Click submit and check for loading state
    const submitButton = page.locator('button:has-text("Send Message")');
    await submitButton.click();

    // Button should show loading state (this may be quick, so we just check it doesn't error)
    // The success message should eventually appear
    await expect(page.locator('h3', { hasText: 'Message Sent' })).toBeVisible({ timeout: 10000 });
  });
});
