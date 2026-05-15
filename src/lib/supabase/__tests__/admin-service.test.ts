/**
 * Unit tests for the pure JSON-aggregation helper in admin-service.ts.
 *
 * We test ONLY the pure function — all the Supabase-backed queries are
 * integration-territory and would require either a live test database
 * or a heavy mock of `@supabase/supabase-js`. The aggregator is the
 * only non-trivial pure logic in the module and is what the dashboard's
 * "Top products" widget depends on.
 *
 * Sentry is mocked because the helper calls `captureMessage` on
 * malformed input, and we don't want test runs to attempt a real
 * Sentry round-trip.
 */

jest.mock('@sentry/nextjs', () => ({
  captureMessage: jest.fn(),
}));

// `server-only` is a Next.js guard that throws when imported outside a
// server runtime. Jest runs in jsdom, so we stub it.
jest.mock('server-only', () => ({}), { virtual: true });

import { parseOrderItemsForTopProducts } from '../admin-service';

describe('parseOrderItemsForTopProducts', () => {
  it('sums units across two orders sharing one product', () => {
    const result = parseOrderItemsForTopProducts([
      {
        id: 'order-1',
        items: [
          { name: 'Oud Royale', quantity: 2, price: 50 },
          { name: 'Rose Petal', quantity: 1, price: 30 },
        ],
      },
      {
        id: 'order-2',
        items: [{ name: 'Oud Royale', quantity: 3, price: 50 }],
      },
    ]);

    const oud = result.find((r) => r.name === 'Oud Royale');
    const rose = result.find((r) => r.name === 'Rose Petal');

    expect(oud).toBeDefined();
    expect(oud?.units).toBe(5);
    expect(oud?.revenue).toBe(250); // 5 * 50

    expect(rose).toBeDefined();
    expect(rose?.units).toBe(1);
    expect(rose?.revenue).toBe(30);
  });

  it('returns empty array and does not throw on malformed items', () => {
    expect(() =>
      parseOrderItemsForTopProducts([
        { id: 'bad-1', items: null as never },
        { id: 'bad-2', items: 'not-an-array' as never },
        { id: 'bad-3', items: { not: 'an array either' } as never },
      ])
    ).not.toThrow();

    const result = parseOrderItemsForTopProducts([
      { id: 'partial', items: [{ name: 'No Quantity', price: 10 }] as never },
      { id: 'good', items: [{ name: 'Good Item', quantity: 1, price: 10 }] },
    ]);

    // partial entry skipped, good entry kept
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Good Item');
  });

  it('computes revenue as quantity * price, not total / count', () => {
    const result = parseOrderItemsForTopProducts([
      {
        id: 'order-a',
        items: [
          { name: 'Item X', quantity: 4, price: 25 },
        ],
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].units).toBe(4);
    // 4 * 25 = 100; if helper used total/count it would be wrong
    expect(result[0].revenue).toBe(100);
  });

  it('returns empty array on empty input', () => {
    expect(parseOrderItemsForTopProducts([])).toEqual([]);
  });

  it('accepts unitPrice as a fallback for price (forward-compat shape)', () => {
    const result = parseOrderItemsForTopProducts([
      {
        id: 'future-shape',
        items: [{ name: 'Future Item', quantity: 2, unitPrice: 15 } as never],
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].revenue).toBe(30);
  });
});
