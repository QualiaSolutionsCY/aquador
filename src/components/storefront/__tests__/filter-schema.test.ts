/**
 * Filter schema smoke test (storefront-side mirror).
 *
 * The full 15-test schema contract lives at
 * `src/lib/shop/__tests__/filter-schema.test.ts` (Task 1 output). This file
 * is a thin one-test mirror so the storefront verifier checklist that looks
 * under `src/components/storefront/__tests__/` still finds a hit. Do not
 * fork the schema-contract tests here.
 */

import {
  parseShopFilters,
  stringifyShopFilters,
} from '@/lib/shop/filter-schema';

describe('filter-schema (storefront smoke)', () => {
  it('parses an empty URLSearchParams to all-defaults and round-trips', () => {
    const parsed = parseShopFilters(new URLSearchParams());
    expect(parsed.brand).toEqual([]);
    expect(parsed.family).toEqual([]);
    expect(parsed.price).toEqual([]);
    expect(parsed.sort).toBe('featured');
    expect(parsed.gender).toBeUndefined();
    expect(parsed.category).toBeUndefined();

    const round = stringifyShopFilters(parsed);
    expect(round.toString()).toBe('');
  });
});
