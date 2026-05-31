import { collapseToFragranceCards } from '../variants';
import type { Product } from '../types';

/**
 * The products table stores each size as a separate row sharing a base slug.
 * collapseToFragranceCards folds those into one card per fragrance and keeps
 * the CHEAPEST variant, so the shop grid shows each scent once at its entry
 * price (the 50ml at €29.99). These cases pin that contract.
 */
function makeProduct(id: string, price: number, salePrice: number | null = null): Product {
  return {
    id,
    name: id,
    description: '',
    price,
    sale_price: salePrice,
    image: '',
    images: null,
    category: 'women',
    product_type: 'perfume',
    gender: null,
    brand: null,
    size: '50ml',
    tags: null,
    in_stock: true,
    is_active: true,
    created_at: null,
    updated_at: null,
  } as Product;
}

describe('collapseToFragranceCards', () => {
  it('folds 50ml + 100ml into one card, keeping the cheaper 50ml entry price', () => {
    const result = collapseToFragranceCards([
      makeProduct('imagination-by-louis-vuitton', 29.99),
      makeProduct('imagination-by-louis-vuitton-100ml', 199),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('imagination-by-louis-vuitton');
    expect(result[0].price).toBe(29.99);
  });

  it('keeps the cheapest variant regardless of input order', () => {
    const result = collapseToFragranceCards([
      makeProduct('imagination-by-louis-vuitton-100ml', 199),
      makeProduct('imagination-by-louis-vuitton', 29.99),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].price).toBe(29.99);
  });

  it('folds all four size/type rows into one cheapest card', () => {
    const result = collapseToFragranceCards([
      makeProduct('oud-royale', 29.99),
      makeProduct('oud-royale-100ml', 199),
      makeProduct('oud-royale-essence-oil', 39.99),
      makeProduct('oud-royale-body-lotion', 24.99),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('oud-royale-body-lotion');
    expect(result[0].price).toBe(24.99);
  });

  it('respects a sale price that undercuts the base row', () => {
    const result = collapseToFragranceCards([
      makeProduct('rose-attar', 29.99),
      makeProduct('rose-attar-100ml', 199, 19.99),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('rose-attar-100ml');
  });

  it('keeps distinct fragrances separate and preserves first-seen order', () => {
    const result = collapseToFragranceCards([
      makeProduct('alpha', 29.99),
      makeProduct('beta', 49.99),
      makeProduct('alpha-100ml', 199),
    ]);

    expect(result.map((p) => p.id)).toEqual(['alpha', 'beta']);
  });

  it('leaves a single-row product untouched', () => {
    const result = collapseToFragranceCards([makeProduct('solo-scent', 59)]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('solo-scent');
  });
});
