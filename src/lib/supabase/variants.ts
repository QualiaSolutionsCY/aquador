import type { Product } from './types';

/**
 * Pure variant logic for product listing grids. No React / Supabase imports,
 * so it stays unit-testable without a server runtime.
 *
 * The products table is the variant table: 50ml perfume, 100ml perfume, 10ml
 * oil, and 150ml lotion are separate rows whose ids share a base slug (see
 * getProductVariantGroup). A listing grid must show each fragrance once, with
 * size chosen on the product page.
 */
const VARIANT_SUFFIXES = ['-100ml', '-50ml', '-essence-oil', '-body-lotion'] as const;

export function getVariantBaseId(id: string): string {
  return VARIANT_SUFFIXES.reduce(
    (base, suffix) => (base.endsWith(suffix) ? base.slice(0, -suffix.length) : base),
    id,
  );
}

type VariantRow = Pick<Product, 'id' | 'price' | 'sale_price'>;

/** Lowest displayed price for a row — the sale price only when it undercuts. */
function entryPrice(p: VariantRow): number {
  const price = Number(p.price);
  const sale = p.sale_price == null ? null : Number(p.sale_price);
  return sale != null && sale < price ? sale : price;
}

/**
 * Collapse size-variant rows into one card per fragrance for listing grids.
 * Groups rows by base slug and keeps the CHEAPEST variant as the card, so the
 * grid shows the entry price (the 50ml perfume at €29.99) rather than a larger
 * size. First-seen order is preserved so the caller's ordering (in_stock /
 * created_at) still drives the grid.
 */
export function collapseToFragranceCards<T extends VariantRow>(products: T[]): T[] {
  const rep = new Map<string, T>();
  const order: string[] = [];
  for (const product of products) {
    const baseId = getVariantBaseId(product.id);
    const current = rep.get(baseId);
    if (!current) {
      rep.set(baseId, product);
      order.push(baseId);
    } else if (entryPrice(product) < entryPrice(current)) {
      rep.set(baseId, product);
    }
  }
  return order.map((baseId) => rep.get(baseId)!);
}
