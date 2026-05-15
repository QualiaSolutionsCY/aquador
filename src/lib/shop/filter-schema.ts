/**
 * Shop filter + sort schema.
 *
 * Owns the URL contract for the shop page. The shop filter bar (SHOP-01)
 * and sort dropdown (SHOP-02) both read and write filters via these helpers
 * so the URL stays the single source of truth across back/forward navigation
 * and share links.
 *
 * URL shape:
 *   /shop?category=women&gender=women&brand=lattafa,al-haramain
 *        &family=floral,oriental&price=0-30,30-60&sort=price-asc&search=oud
 *
 * Multi-value params (brand, family, price) are comma-separated. Unknown
 * keys and invalid values are stripped silently rather than thrown, so a
 * malformed share link still renders a working shop page.
 */

import { z } from 'zod';
import type { ReadonlyURLSearchParams } from 'next/navigation';
import {
  BRAND_OPTIONS,
  CATEGORY_OPTIONS,
  GENDER_OPTIONS,
  NOTES_FAMILY_OPTIONS,
  PRICE_BANDS,
} from '@/lib/constants';
import type { Product } from '@/lib/supabase/types';

/** Sort keys for the shop sort dropdown. */
export type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'newest';

const CATEGORY_IDS = CATEGORY_OPTIONS.map((c) => c.id);
const GENDER_IDS = GENDER_OPTIONS.map((g) => g.id) as readonly string[];
const BRAND_IDS = BRAND_OPTIONS.map((b) => b.id) as readonly string[];
const FAMILY_IDS = NOTES_FAMILY_OPTIONS.map((f) => f.id) as readonly string[];
const PRICE_BAND_IDS = PRICE_BANDS.map((b) => b.id) as readonly string[];

/**
 * Zod schema that validates the parsed filter object. Invalid array entries
 * are dropped (z.array(...).catch([])), unknown keys are stripped, and the
 * sort field falls back to 'featured'.
 */
export const ShopFiltersSchema = z.object({
  category: z
    .string()
    .refine((v) => CATEGORY_IDS.includes(v), { message: 'unknown category' })
    .optional()
    .catch(undefined),
  gender: z
    .string()
    .refine((v) => GENDER_IDS.includes(v), { message: 'unknown gender' })
    .optional()
    .catch(undefined),
  brand: z
    .array(z.string().refine((v) => BRAND_IDS.includes(v)))
    .default([])
    .catch([]),
  family: z
    .array(z.string().refine((v) => FAMILY_IDS.includes(v)))
    .default([])
    .catch([]),
  price: z
    .array(z.string().refine((v) => PRICE_BAND_IDS.includes(v)))
    .default([])
    .catch([]),
  sort: z
    .enum(['featured', 'price-asc', 'price-desc', 'newest'])
    .default('featured')
    .catch('featured'),
  search: z.string().trim().min(1).optional().catch(undefined),
});

export type ShopFilters = z.infer<typeof ShopFiltersSchema>;

/**
 * Convert a URLSearchParams (or Next.js ReadonlyURLSearchParams) into a
 * normalised ShopFilters object. Invalid input falls back to all defaults
 * so a malformed share link never bricks the page.
 */
export function parseShopFilters(
  params: URLSearchParams | ReadonlyURLSearchParams,
): ShopFilters {
  const splitMulti = (key: string): string[] =>
    params.get(key)?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];

  const raw = {
    category: params.get('category') ?? undefined,
    gender: params.get('gender') ?? undefined,
    brand: splitMulti('brand'),
    family: splitMulti('family'),
    price: splitMulti('price'),
    sort: params.get('sort') ?? undefined,
    search: params.get('search') ?? undefined,
  };

  const parsed = ShopFiltersSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  return ShopFiltersSchema.parse({});
}

/**
 * Serialise a ShopFilters object back into a URLSearchParams. Defaults are
 * omitted so the canonical "no filters" URL is just /shop. Multi-value
 * params join with ','.
 */
export function stringifyShopFilters(filters: ShopFilters): URLSearchParams {
  const out = new URLSearchParams();
  if (filters.category) out.set('category', filters.category);
  if (filters.gender) out.set('gender', filters.gender);
  if (filters.brand.length > 0) out.set('brand', filters.brand.join(','));
  if (filters.family.length > 0) out.set('family', filters.family.join(','));
  if (filters.price.length > 0) out.set('price', filters.price.join(','));
  if (filters.sort && filters.sort !== 'featured') out.set('sort', filters.sort);
  if (filters.search && filters.search.length > 0) out.set('search', filters.search);
  return out;
}

/** Display price = sale price when present, otherwise list price. */
function displayPrice(product: Product): number {
  return product.sale_price ?? product.price;
}

/**
 * True if displayPrice falls inside the band's [min, max) interval, or
 * >= min when the band is open-ended (max === null).
 */
function bandMatchesPrice(bandId: string, price: number): boolean {
  const band = PRICE_BANDS.find((b) => b.id === bandId);
  if (!band) return false;
  if (band.max === null) return price >= band.min;
  return price >= band.min && price < band.max;
}

/**
 * Apply every filter dimension to the product list. Empty arrays mean
 * "no filter on this dimension" (pass-through).
 */
export function applyShopFilters(
  products: Product[],
  filters: ShopFilters,
): Product[] {
  return products.filter((p) => {
    if (filters.category && p.category !== filters.category) return false;
    if (filters.gender && p.gender !== filters.gender) return false;

    if (filters.brand.length > 0) {
      const productBrand = p.brand?.toLowerCase().trim() ?? '';
      // Match either the slug ('lattafa') or the label ('Lattafa') against
      // the free-text brand column. 'other' matches anything that does not
      // match the named brands.
      const namedBrandIds = BRAND_OPTIONS.filter((b) => b.id !== 'other').map(
        (b) => b.id,
      );
      const namedBrandLabels = BRAND_OPTIONS.filter((b) => b.id !== 'other').map(
        (b) => b.label.toLowerCase(),
      );
      const matched = filters.brand.some((bid) => {
        if (bid === 'other') {
          // 'other' = brand is set but does not match any named brand
          const matchesNamed = namedBrandIds.some(
            (id) => productBrand.includes(id) || productBrand === id,
          ) || namedBrandLabels.some((label) => productBrand.includes(label));
          return productBrand.length > 0 && !matchesNamed;
        }
        const option = BRAND_OPTIONS.find((b) => b.id === bid);
        if (!option) return false;
        const label = option.label.toLowerCase();
        return (
          productBrand === bid ||
          productBrand.includes(bid) ||
          productBrand.includes(label)
        );
      });
      if (!matched) return false;
    }

    if (filters.family.length > 0) {
      const tags = (p.tags ?? []).map((t) => t.toLowerCase());
      const matched = filters.family.some((f) => tags.includes(f));
      if (!matched) return false;
    }

    if (filters.price.length > 0) {
      const price = displayPrice(p);
      const matched = filters.price.some((bid) => bandMatchesPrice(bid, price));
      if (!matched) return false;
    }

    if (filters.search && filters.search.length > 0) {
      const needle = filters.search.toLowerCase();
      const haystack = [
        p.name,
        p.description,
        p.brand ?? '',
        ...(p.tags ?? []),
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(needle)) return false;
    }

    return true;
  });
}

/**
 * Sort products without mutating the input array.
 *
 * - 'featured': tags.includes('featured') first, then in_stock, then newest
 * - 'price-asc' / 'price-desc': by displayPrice
 * - 'newest': by created_at descending
 */
export function applyShopSort(products: Product[], sort: SortKey): Product[] {
  const out = products.slice();
  switch (sort) {
    case 'price-asc':
      out.sort((a, b) => displayPrice(a) - displayPrice(b));
      break;
    case 'price-desc':
      out.sort((a, b) => displayPrice(b) - displayPrice(a));
      break;
    case 'newest':
      out.sort((a, b) => {
        const ta = a.created_at ? Date.parse(a.created_at) : 0;
        const tb = b.created_at ? Date.parse(b.created_at) : 0;
        return tb - ta;
      });
      break;
    case 'featured':
    default:
      out.sort((a, b) => {
        const fa = a.tags?.includes('featured') ? 1 : 0;
        const fb = b.tags?.includes('featured') ? 1 : 0;
        if (fa !== fb) return fb - fa;
        const sa = a.in_stock ? 1 : 0;
        const sb = b.in_stock ? 1 : 0;
        if (sa !== sb) return sb - sa;
        const ta = a.created_at ? Date.parse(a.created_at) : 0;
        const tb = b.created_at ? Date.parse(b.created_at) : 0;
        return tb - ta;
      });
      break;
  }
  return out;
}
