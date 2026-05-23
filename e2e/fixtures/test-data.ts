import { Page, expect } from '@playwright/test';

// Test data prefix to identify E2E test products
export const TEST_DATA_PREFIX = '[E2E-TEST]';

/**
 * A known active + in-stock product slug from the live Supabase catalogue.
 * Sourced 2026-05-17 via:
 *   service-role REST check after Aquad'or variant sync:
 *     select id from products where id='pure-musk' and in_stock=true and is_active=true
 *
 * The `id` column doubles as the product slug — `getProductBySlug` in
 * src/lib/supabase/product-service.ts:74 calls `getProductById(slug)`.
 *
 * This particular row is "Pure Musk" (€29.99), an Aquad'or house scent with
 * sibling product rows for 100ml perfume, essence oil, and body lotion.
 */
export const ANY_IN_STOCK_SLUG = 'pure-musk';

/**
 * Generates a unique test product name
 */
export function generateTestProductName(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `${TEST_DATA_PREFIX} Test Product ${timestamp}-${random}`;
}

/**
 * Test product data structure
 */
export interface TestProductData {
  name: string;
  description: string;
  price: string;
  category: 'men' | 'women' | 'niche' | 'essence-oil' | 'body-lotion';
  product_type: 'perfume' | 'essence-oil' | 'body-lotion';
  size: string;
  image: string;
  in_stock: boolean;
  gender?: 'male' | 'female' | 'unisex';
}

/**
 * Creates a test product with default values
 */
export function createTestProductData(overrides?: Partial<TestProductData>): TestProductData {
  return {
    name: generateTestProductName(),
    description: 'This is a test product created by E2E tests. It should be automatically cleaned up.',
    price: '49.99',
    category: 'men',
    product_type: 'perfume',
    size: '100ml',
    image: 'https://via.placeholder.com/400x400?text=E2E+Test+Product',
    in_stock: true,
    gender: 'male',
    ...overrides,
  };
}

/**
 * Creates a test product through the admin UI
 * Returns the product name for later identification
 */
export async function createTestProduct(
  page: Page,
  productData?: Partial<TestProductData>
): Promise<string> {
  const data = createTestProductData(productData);

  // Navigate to new product page
  await page.goto('/admin/products/new');
  await expect(page.locator('h1:has-text("Add Product")')).toBeVisible();

  // Fill in the form
  await page.fill('input[name="name"]', data.name);
  await page.fill('textarea[name="description"]', data.description);
  await page.fill('input[name="price"]', data.price);
  await page.selectOption('select[name="category"]', data.category);
  await page.selectOption('select[name="product_type"]', data.product_type);
  await page.fill('input[name="size"]', data.size);
  await page.fill('input[name="image"]', data.image);

  // Handle in_stock checkbox
  const checkbox = page.locator('input[name="in_stock"]');
  if (data.in_stock) {
    await checkbox.check();
  } else {
    await checkbox.uncheck();
  }

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for redirect to products list
  await page.waitForURL('/admin/products', { timeout: 10000 });

  return data.name;
}

/**
 * Deletes a test product by name through the admin UI
 */
export async function deleteTestProduct(page: Page, productName: string): Promise<void> {
  // Navigate to products page
  await page.goto('/admin/products');

  // Search for the product
  await page.fill('input[name="search"]', productName);
  await page.press('input[name="search"]', 'Enter');

  // Wait for search results
  await page.waitForTimeout(1000);

  // Find and click the delete button for this product
  const row = page.locator(`tr:has-text("${productName}")`);
  if ((await row.count()) > 0) {
    await row.locator('button[title="Delete"]').click();

    // Confirm deletion in modal
    await expect(page.locator('h3:has-text("Delete Product")')).toBeVisible();
    await page.click('button:has-text("Delete"):not(:has-text("Cancel"))');

    // Wait for deletion to complete
    await page.waitForTimeout(1000);
  }
}

/**
 * Cleans up all test products (those with TEST_DATA_PREFIX)
 */
export async function cleanupTestProducts(page: Page): Promise<void> {
  // Navigate to products page
  await page.goto('/admin/products');

  // Search for test products
  await page.fill('input[name="search"]', TEST_DATA_PREFIX);
  await page.press('input[name="search"]', 'Enter');

  // Wait for search results
  await page.waitForTimeout(1000);

  // Get all test product rows
  const rows = page.locator(`tr:has-text("${TEST_DATA_PREFIX}")`);
  let count = await rows.count();

  // Delete each test product
  while (count > 0) {
    // Click delete on the first row
    await rows.first().locator('button[title="Delete"]').click();

    // Confirm deletion
    await expect(page.locator('h3:has-text("Delete Product")')).toBeVisible();
    await page.click('button:has-text("Delete"):not(:has-text("Cancel"))');

    // Wait for deletion to complete and refresh
    await page.waitForTimeout(1000);

    // Refresh search results
    await page.goto('/admin/products');
    await page.fill('input[name="search"]', TEST_DATA_PREFIX);
    await page.press('input[name="search"]', 'Enter');
    await page.waitForTimeout(1000);

    count = await rows.count();
  }
}

/**
 * Test admin user data structure
 */
export interface TestAdminUserData {
  email: string;
  password: string;
  role: 'admin' | 'super_admin';
}

/**
 * Creates test admin user data with unique email
 */
export function createTestAdminUserData(overrides?: Partial<TestAdminUserData>): TestAdminUserData {
  const timestamp = Date.now();
  return {
    email: `e2e-test-admin-${timestamp}@test.aquadorcy.com`,
    password: 'TestPassword123!',
    role: 'admin',
    ...overrides,
  };
}
