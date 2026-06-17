/**
 * Admin product-editor serialization: the manual stock count is the single
 * source of truth for availability. `in_stock` is derived (quantity > 0) on
 * save — there is no separate toggle the admin can desync from the count.
 */

import type { Product } from '@/lib/supabase/types';
import type { ProductFormValues } from '../schema';
import { buildDefaults, toPayload } from '../serialize';

const baseValues = (overrides: Partial<ProductFormValues> = {}): ProductFormValues => ({
  name: 'Rose Eau',
  brand: 'Aquador',
  category: 'women',
  product_type: 'perfume',
  gender: 'women',
  size: '50ml',
  price: 29.99,
  sale_price: '',
  in_stock: true,
  stock_quantity: 10,
  description: 'A rose',
  image: 'https://example.com/rose.jpg',
  images: [],
  tags: [],
  is_active: true,
  featured: false,
  ...overrides,
});

describe('toPayload — in_stock derived from stock_quantity', () => {
  it('marks the product out of stock when quantity is 0', () => {
    const payload = toPayload(baseValues({ stock_quantity: 0 }));
    expect(payload.stock_quantity).toBe(0);
    expect(payload.in_stock).toBe(false);
  });

  it('marks the product in stock for any positive quantity', () => {
    const payload = toPayload(baseValues({ stock_quantity: 1 }));
    expect(payload.stock_quantity).toBe(1);
    expect(payload.in_stock).toBe(true);
  });

  it('persists the exact quantity the admin entered', () => {
    const payload = toPayload(baseValues({ stock_quantity: 42 }));
    expect(payload.stock_quantity).toBe(42);
  });
});

describe('buildDefaults — round-trips stock_quantity from the DB row', () => {
  it('reads the stored quantity onto the form', () => {
    const product = { stock_quantity: 7, in_stock: true } as Product;
    expect(buildDefaults(product).stock_quantity).toBe(7);
  });

  it('defaults quantity to 0 for a new product (null row)', () => {
    expect(buildDefaults(null).stock_quantity).toBe(0);
  });
});
