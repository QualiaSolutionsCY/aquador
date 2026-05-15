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
    expect(f.price).toEqual([]);
    expect(f.inStock).toBeUndefined();
  });

  it('strips unknown enum values silently', () => {
    const f = ShopFiltersSchema.parse({ sort: 'random-junk' });
    expect(f.sort).toBe('featured');
  });

  it('accepts arbitrary kebab-case brand slugs (catalogue-driven)', () => {
    const f = ShopFiltersSchema.parse({
      brand: ['tom-ford', 'maison-francis-kurkdjian'],
    });
    expect(f.brand).toEqual(['tom-ford', 'maison-francis-kurkdjian']);
  });

  it('drops non-kebab-case brand entries', () => {
    const f = ShopFiltersSchema.parse({ brand: ['Tom Ford', 'lattafa'] });
    expect(f.brand).toEqual([]);
  });

  it('accepts inStock as boolean', () => {
    const f = ShopFiltersSchema.parse({ inStock: true });
    expect(f.inStock).toBe(true);
  });
});

describe('parseShopFilters / stringifyShopFilters round-trip', () => {
  it('handles single + multi-value params including in_stock', () => {
    const u = new URLSearchParams(
      'brand=lattafa,tom-ford&price=0-30,30-60&sort=price-asc&category=women&in_stock=1',
    );
    const parsed = parseShopFilters(u);
    expect(parsed.brand).toEqual(['lattafa', 'tom-ford']);
    expect(parsed.price).toEqual(['0-30', '30-60']);
    expect(parsed.sort).toBe('price-asc');
    expect(parsed.category).toBe('women');
    expect(parsed.inStock).toBe(true);

    const restringified = stringifyShopFilters(parsed);
    expect(restringified.get('in_stock')).toBe('1');
    const reparsed = parseShopFilters(restringified);
    expect(reparsed).toEqual(parsed);
  });

  it('drops invalid sort but keeps valid kebab-case brand slugs', () => {
    const u = new URLSearchParams('brand=lattafa,Tom Ford&sort=bogus');
    const parsed = parseShopFilters(u);
    expect(parsed.sort).toBe('featured');
    // The whole brand array fails Zod refine because one entry is invalid;
    // .catch([]) on the array produces an empty array.
    expect(parsed.brand).toEqual([]);
  });

  it('omits default sort and unset in_stock from output', () => {
    const f: ShopFilters = {
      brand: [],
      price: [],
      sort: 'featured',
    } as ShopFilters;
    const s = stringifyShopFilters(f);
    expect(s.get('sort')).toBeNull();
    expect(s.get('in_stock')).toBeNull();
  });
});

describe('applyShopFilters', () => {
  const products: Product[] = [
    makeProduct({ id: 'a', brand: 'Lattafa', price: 25, tags: ['floral'], category: 'women' }),
    makeProduct({ id: 'b', brand: 'Al Haramain', price: 75, tags: ['woody'], category: 'men' }),
    makeProduct({ id: 'c', brand: 'Tom Ford', price: 120, tags: ['oriental'], category: 'niche' }),
    makeProduct({ id: 'd', brand: 'Lattafa', sale_price: 20, price: 60, tags: ['floral'], category: 'women' }),
    makeProduct({ id: 'e', brand: null, price: 40, in_stock: false, category: 'niche' }),
  ];

  it('filters by brand slug (slugified from brand text column)', () => {
    const out = applyShopFilters(
      products,
      parseShopFilters(new URLSearchParams('brand=lattafa')),
    );
    expect(out.map((p) => p.id).sort()).toEqual(['a', 'd']);
  });

  it('filters by multi-word brand slug', () => {
    const out = applyShopFilters(
      products,
      parseShopFilters(new URLSearchParams('brand=tom-ford')),
    );
    expect(out.map((p) => p.id)).toEqual(['c']);
  });

  it('drops products with null brand when any brand filter is active', () => {
    const out = applyShopFilters(
      products,
      parseShopFilters(new URLSearchParams('brand=lattafa')),
    );
    expect(out.find((p) => p.id === 'e')).toBeUndefined();
  });

  it('uses sale_price as display price for band match', () => {
    // product d has sale_price=20, so it falls in 0-30
    const out = applyShopFilters(
      products,
      parseShopFilters(new URLSearchParams('price=0-30')),
    );
    expect(out.map((p) => p.id).sort()).toEqual(['a', 'd']);
  });

  it('100+ open-ended band matches >= 100', () => {
    const out = applyShopFilters(
      products,
      parseShopFilters(new URLSearchParams('price=100%2B')),
    );
    expect(out.map((p) => p.id)).toEqual(['c']);
  });

  it('inStock=true drops out-of-stock products', () => {
    const out = applyShopFilters(
      products,
      parseShopFilters(new URLSearchParams('in_stock=1')),
    );
    expect(out.find((p) => p.id === 'e')).toBeUndefined();
    expect(out.length).toBe(4);
  });

  it('omitted in_stock is a pass-through (out-of-stock still shows)', () => {
    const out = applyShopFilters(products, parseShopFilters(new URLSearchParams()));
    expect(out.find((p) => p.id === 'e')).toBeDefined();
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
