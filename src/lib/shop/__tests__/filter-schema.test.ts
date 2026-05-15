import {
  parseShopFilters,
  stringifyShopFilters,
  applyShopFilters,
  applyShopSort,
  ShopFiltersSchema,
  type ShopFilters,
} from '@/lib/shop/filter-schema';
import type { Product } from '@/lib/supabase/types';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    brand: null,
    category: 'women',
    created_at: '2026-01-01T00:00:00Z',
    description: 'desc',
    gender: 'unisex',
    id: 'p1',
    image: '/img.jpg',
    images: null,
    in_stock: true,
    is_active: true,
    name: 'Test Product',
    price: 50,
    product_type: 'perfume',
    sale_price: null,
    size: '50ml',
    tags: null,
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('ShopFiltersSchema defaults', () => {
  it('returns featured sort and empty arrays for empty input', () => {
    const f = ShopFiltersSchema.parse({});
    expect(f.sort).toBe('featured');
    expect(f.brand).toEqual([]);
    expect(f.family).toEqual([]);
    expect(f.price).toEqual([]);
  });

  it('strips unknown enum values silently', () => {
    const f = ShopFiltersSchema.parse({ sort: 'random-junk' });
    expect(f.sort).toBe('featured');
  });
});

describe('parseShopFilters / stringifyShopFilters round-trip', () => {
  it('handles single + multi-value params', () => {
    const u = new URLSearchParams(
      'brand=lattafa,al-haramain&price=0-30,30-60&sort=price-asc&category=women',
    );
    const parsed = parseShopFilters(u);
    expect(parsed.brand).toEqual(['lattafa', 'al-haramain']);
    expect(parsed.price).toEqual(['0-30', '30-60']);
    expect(parsed.sort).toBe('price-asc');
    expect(parsed.category).toBe('women');

    const restringified = stringifyShopFilters(parsed);
    const reparsed = parseShopFilters(restringified);
    expect(reparsed).toEqual(parsed);
  });

  it('drops invalid values without throwing', () => {
    const u = new URLSearchParams('brand=lattafa,not-a-brand&sort=bogus');
    const parsed = parseShopFilters(u);
    expect(parsed.sort).toBe('featured');
  });

  it('omits default sort from output', () => {
    const f: ShopFilters = {
      brand: [],
      family: [],
      price: [],
      sort: 'featured',
    } as ShopFilters;
    const s = stringifyShopFilters(f);
    expect(s.get('sort')).toBeNull();
  });
});

describe('applyShopFilters', () => {
  const products: Product[] = [
    makeProduct({ id: 'a', brand: 'Lattafa', price: 25, tags: ['floral'], category: 'women' }),
    makeProduct({ id: 'b', brand: 'Al Haramain', price: 75, tags: ['woody'], category: 'men' }),
    makeProduct({ id: 'c', brand: 'BoutiqueX', price: 120, tags: ['oriental'], category: 'niche' }),
    makeProduct({ id: 'd', brand: 'Lattafa', sale_price: 20, price: 60, tags: ['floral'], category: 'women' }),
  ];

  it('filters by brand slug case-insensitively', () => {
    const out = applyShopFilters(products, parseShopFilters(new URLSearchParams('brand=lattafa')));
    expect(out.map((p) => p.id).sort()).toEqual(['a', 'd']);
  });

  it("matches 'other' brand to non-named brands", () => {
    const out = applyShopFilters(products, parseShopFilters(new URLSearchParams('brand=other')));
    expect(out.map((p) => p.id)).toEqual(['c']);
  });

  it('uses sale_price as display price for band match', () => {
    // product d has sale_price=20, so it falls in 0-30
    const out = applyShopFilters(products, parseShopFilters(new URLSearchParams('price=0-30')));
    expect(out.map((p) => p.id).sort()).toEqual(['a', 'd']);
  });

  it('matches family tags', () => {
    const out = applyShopFilters(products, parseShopFilters(new URLSearchParams('family=floral')));
    expect(out.map((p) => p.id).sort()).toEqual(['a', 'd']);
  });

  it('100+ open-ended band matches >= 100', () => {
    const out = applyShopFilters(products, parseShopFilters(new URLSearchParams('price=100%2B')));
    expect(out.map((p) => p.id)).toEqual(['c']);
  });
});

describe('applyShopSort', () => {
  const products: Product[] = [
    makeProduct({ id: 'a', price: 50, tags: [], in_stock: true, created_at: '2026-01-01T00:00:00Z' }),
    makeProduct({ id: 'b', price: 30, tags: ['featured'], in_stock: true, created_at: '2025-01-01T00:00:00Z' }),
    makeProduct({ id: 'c', price: 100, tags: [], in_stock: false, created_at: '2026-03-01T00:00:00Z' }),
  ];

  it('price-asc sorts by display price ascending', () => {
    const out = applyShopSort(products, 'price-asc');
    expect(out.map((p) => p.id)).toEqual(['b', 'a', 'c']);
  });

  it('price-desc sorts by display price descending', () => {
    const out = applyShopSort(products, 'price-desc');
    expect(out.map((p) => p.id)).toEqual(['c', 'a', 'b']);
  });

  it('newest sorts by created_at descending', () => {
    const out = applyShopSort(products, 'newest');
    expect(out.map((p) => p.id)).toEqual(['c', 'a', 'b']);
  });

  it('featured ranks featured first, then in-stock, then newest', () => {
    const out = applyShopSort(products, 'featured');
    // b is featured -> first; then a (in-stock, newer than c-stock-false? c is newer but out of stock) -> a; then c
    expect(out[0].id).toBe('b');
    expect(out[1].id).toBe('a');
    expect(out[2].id).toBe('c');
  });

  it('does not mutate input array', () => {
    const before = products.map((p) => p.id);
    applyShopSort(products, 'price-desc');
    expect(products.map((p) => p.id)).toEqual(before);
  });
});
