/**
 * Server-side stock enforcement in validateCartPrices.
 *
 * This is the authoritative gate: the storefront hides the buy button, but a
 * stale localStorage cart or a direct POST to /api/checkout must still be
 * rejected when a product is out of stock or the requested quantity exceeds
 * what's available.
 */

import type { CartItem } from '@/types/cart';
import type { Product } from '@/lib/supabase/types';

const getProductsByIds = jest.fn();
const findActiveProductByCartFingerprint = jest.fn();

jest.mock('@/lib/supabase/product-service', () => ({
  getProductsByIds: (...args: unknown[]) => getProductsByIds(...args),
  findActiveProductByCartFingerprint: (...args: unknown[]) =>
    findActiveProductByCartFingerprint(...args),
}));

import { validateCartPrices } from '../cart';

const makeProduct = (overrides: Partial<Product> = {}): Product =>
  ({
    id: 'rose-eau',
    name: 'Rose Eau',
    description: 'A rose',
    price: 29.99,
    sale_price: null,
    image: '/rose.jpg',
    images: null,
    category: 'women',
    product_type: 'perfume',
    gender: 'women',
    brand: 'Aquador',
    size: '50ml',
    tags: null,
    in_stock: true,
    stock_quantity: 5,
    is_active: true,
    created_at: null,
    updated_at: null,
    ...overrides,
  }) as Product;

const makeItem = (overrides: Partial<CartItem> = {}): CartItem => ({
  productId: 'rose-eau',
  variantId: 'rose-eau-perfume-50ml',
  quantity: 1,
  name: 'Rose Eau',
  image: '/rose.jpg',
  price: 29.99,
  size: '50ml',
  productType: 'perfume',
  ...overrides,
});

beforeEach(() => {
  getProductsByIds.mockReset();
  findActiveProductByCartFingerprint.mockReset();
  findActiveProductByCartFingerprint.mockResolvedValue(null);
});

describe('validateCartPrices — stock gate', () => {
  it('rejects an item whose product is flagged out of stock', async () => {
    getProductsByIds.mockResolvedValue([makeProduct({ in_stock: false, stock_quantity: 0 })]);

    const result = await validateCartPrices([makeItem({ quantity: 1 })]);

    expect(result.valid).toBe(false);
    expect(result.errors?.[0]?.reason).toBe('Out of stock');
  });

  it('rejects ordering more units than are in stock', async () => {
    getProductsByIds.mockResolvedValue([makeProduct({ stock_quantity: 3 })]);

    const result = await validateCartPrices([makeItem({ quantity: 4 })]);

    expect(result.valid).toBe(false);
    expect(result.errors?.[0]?.reason).toMatch(/Only 3 in stock/);
  });

  it('allows ordering exactly the available stock', async () => {
    getProductsByIds.mockResolvedValue([makeProduct({ stock_quantity: 3 })]);

    const result = await validateCartPrices([makeItem({ quantity: 3 })]);

    expect(result.valid).toBe(true);
    expect(result.correctedItems?.[0]?.quantity).toBe(3);
  });

  it('allows ordering within stock', async () => {
    getProductsByIds.mockResolvedValue([makeProduct({ stock_quantity: 5 })]);

    const result = await validateCartPrices([makeItem({ quantity: 2 })]);

    expect(result.valid).toBe(true);
    expect(result.correctedItems).toHaveLength(1);
  });
});
