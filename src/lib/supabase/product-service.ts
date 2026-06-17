import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import * as Sentry from '@sentry/nextjs';
import { createPublicClient } from './public';
import type { Product, ProductCategory } from './types';
import { categories } from '../categories';
import { slugify } from '../utils';
import { isDisallowedSampleSize } from '@/lib/product-description';
import { getVariantBaseId, collapseToFragranceCards } from './variants';

// Re-export categories since they're static
export { categories };

// Re-export the pure variant-collapsing helper so listing pages can import it
// alongside the data fetchers. Implementation lives in ./variants (no React /
// Supabase imports) so it stays unit-testable without a server runtime.
export { collapseToFragranceCards };

/** Escape PostgREST special characters in search queries */
function escapePostgrestQuery(query: string): string {
  return query.replace(/[%_\\*()[\]!,]/g, '\\$&');
}

/** Explicit column selection for product queries (avoids select(*) overhead) */
const PRODUCT_COLUMNS = 'id, name, description, price, sale_price, image, images, category, product_type, gender, brand, size, tags, in_stock, stock_quantity, is_active, created_at, updated_at' as const;
const PRODUCT_LIST_REVALIDATE_SECONDS = 60;

function hasPublicSupabaseEnv(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function filterPublicProducts<T extends { size: string | null }>(products: T[] | null): T[] {
  return (products || []).filter((product) => !isDisallowedSampleSize(product.size));
}

const VARIANT_ORDER: Record<string, number> = {
  'perfume:50ml': 0,
  'perfume:100ml': 1,
  'essence-oil:10ml': 2,
  'body-lotion:150ml': 3,
};

function getVariantSortKey(product: Pick<Product, 'product_type' | 'size'>): number {
  return VARIANT_ORDER[`${product.product_type}:${product.size}`] ?? 99;
}

// Get all products from Supabase (public-facing, filters inactive)
export async function getAllProducts(): Promise<Product[]> {
  if (!hasPublicSupabaseEnv()) return [];
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .eq('is_active', true)
    .order('in_stock', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    Sentry.addBreadcrumb({ category: 'product-service', message: 'Error fetching products', level: 'error', data: { error } });
    return [];
  }

  return filterPublicProducts(data);
}

// Get products for the main Dubai shop. Lattafa has its own route and
// non-perfume product types are variants on PDPs, not standalone listing rows.
async function fetchShopProducts(): Promise<Product[]> {
  if (!hasPublicSupabaseEnv()) return [];
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .eq('is_active', true)
    .eq('product_type', 'perfume')
    .neq('category', 'lattafa-original')
    .order('in_stock', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    Sentry.addBreadcrumb({ category: 'product-service', message: 'Error fetching shop products', level: 'error', data: { error } });
    return [];
  }

  // One card per fragrance — fold size variants into the cheapest (50ml, €29.99)
  // representative so the grid shows the entry price, not the larger sizes.
  return collapseToFragranceCards(filterPublicProducts(data));
}

export const getShopProducts = unstable_cache(
  fetchShopProducts,
  ['shop-products-v1'],
  {
    revalidate: PRODUCT_LIST_REVALIDATE_SECONDS,
    tags: ['products', 'shop-products'],
  },
);

// Get product by ID (returns null if inactive)
export async function getProductById(id: string): Promise<Product | null> {
  if (!hasPublicSupabaseEnv()) return null;
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    Sentry.addBreadcrumb({ category: 'product-service', message: 'Error fetching product', level: 'error', data: { error, id } });
    return null;
  }

  return data && !isDisallowedSampleSize(data.size) ? data : null;
}

// Batch fetch products by IDs (single query, no N+1)
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  if (!hasPublicSupabaseEnv()) return [];

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .in('id', ids);

  if (error) {
    Sentry.addBreadcrumb({ category: 'product-service', message: 'Error batch fetching products', level: 'error', data: { error, ids } });
    return [];
  }

  return filterPublicProducts(data);
}

export async function findActiveProductByCartFingerprint(
  name: string,
  size: string,
  productType: Product['product_type'],
): Promise<Product | null> {
  if (!hasPublicSupabaseEnv()) return null;

  const variantName = productType === 'essence-oil'
    ? `${name} (Essence Oil)`
    : productType === 'body-lotion'
      ? `${name} (Body Lotion)`
      : `${name} (${size})`;
  const candidateNames = [...new Set([name, variantName])];
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .in('name', candidateNames)
    .eq('size', size)
    .eq('product_type', productType)
    .eq('is_active', true)
    .limit(1);

  if (error) {
    Sentry.addBreadcrumb({
      category: 'product-service',
      message: 'Error recovering stale cart product',
      level: 'error',
      data: { error, name, size, productType },
    });
    return null;
  }

  const product = data?.[0] ?? null;
  return product && !isDisallowedSampleSize(product.size) ? product : null;
}

// Get product by slug — cached per request to dedup generateMetadata + page component calls
export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  return getProductById(slug);
});

// Get buyable sibling rows for one Aquad'or scent. The products table is the
// variant table: 50ml perfume, 100ml perfume, 10ml oil, and 150ml lotion are
// separate rows whose ids share a base slug.
export async function getProductVariantGroup(product: Product): Promise<Product[]> {
  const baseId = getVariantBaseId(product.id);
  const variantIds = [
    baseId,
    `${baseId}-100ml`,
    `${baseId}-essence-oil`,
    `${baseId}-body-lotion`,
  ];
  const products = await getProductsByIds(variantIds);
  const seen = new Set<string>();

  return products
    .filter((candidate) => {
      if (seen.has(candidate.id)) return false;
      seen.add(candidate.id);
      return candidate.is_active !== false;
    })
    .sort((a, b) => getVariantSortKey(a) - getVariantSortKey(b));
}

// Get products by category (filters inactive)
async function fetchProductsByCategory(category: string): Promise<Product[]> {
  if (!hasPublicSupabaseEnv()) return [];
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .eq('category', category as ProductCategory)
    .eq('is_active', true)
    .order('in_stock', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    Sentry.addBreadcrumb({ category: 'product-service', message: 'Error fetching products by category', level: 'error', data: { error, category } });
    return [];
  }

  return filterPublicProducts(data);
}

export const getProductsByCategory = unstable_cache(
  fetchProductsByCategory,
  ['products-by-category-v1'],
  {
    revalidate: PRODUCT_LIST_REVALIDATE_SECONDS,
    tags: ['products', 'products-by-category'],
  },
);

async function fetchPerfumeProductsByCategory(category: string): Promise<Product[]> {
  if (!hasPublicSupabaseEnv()) return [];
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .eq('category', category as ProductCategory)
    .eq('product_type', 'perfume')
    .eq('is_active', true)
    .order('in_stock', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    Sentry.addBreadcrumb({ category: 'product-service', message: 'Error fetching perfume products by category', level: 'error', data: { error, category } });
    return [];
  }

  // One card per fragrance (cheapest variant kept) — size is chosen on the PDP.
  return collapseToFragranceCards(filterPublicProducts(data));
}

export const getPerfumeProductsByCategory = unstable_cache(
  fetchPerfumeProductsByCategory,
  ['perfume-products-by-category-v1'],
  {
    revalidate: PRODUCT_LIST_REVALIDATE_SECONDS,
    tags: ['products', 'perfume-products-by-category'],
  },
);

// Curator's mix for the homepage featured grid. The mix pulls 8 Aquad'or-house
// slots (niche / essence-oil / women / men) and 4 Lattafa-originals, then
// round-robin interleaves them so the grid visibly alternates brand families
// in a 3:1 cadence (house · house · Lattafa · house · house · Lattafa ...).
//
// Without this interleave the previous version grouped all Lattafa at the end
// of the grid, so the visual read was "Aquad'or page with a Lattafa tail".
// The user feedback called this out directly: "show the perfumes 1 of aquador
// then 1 from lattafa and so on". The 8:4 split keeps a clean rhythm at 12
// cards without making Lattafa over-represented.
const FEATURED_HOUSE_MIX: ReadonlyArray<{ category: ProductCategory; take: number }> = [
  { category: 'niche', take: 2 },
  { category: 'essence-oil', take: 2 },
  { category: 'women', take: 2 },
  { category: 'men', take: 2 },
];

const FEATURED_LATTAFA_TAKE = 4;

const LATTAFA_CATEGORIES: ReadonlySet<ProductCategory> = new Set([
  'lattafa-original',
]);

/**
 * Returns true if a product belongs to the Lattafa-originals family, false if
 * it belongs to an Aquad'or-house line. Exported so the storefront can stamp
 * a visible brand-family label on each featured card.
 */
export function isLattafaProduct(product: Product): boolean {
  return LATTAFA_CATEGORIES.has(product.category);
}

/**
 * Interleave two ordered lists with a fixed cadence. `cadence` is the number
 * of `primary` items emitted between each `secondary` item.
 *
 * Example: interleave([a,b,c,d,e,f,g,h], [x,y,z,w], 2) →
 *   [a,b,x, c,d,y, e,f,z, g,h,w]
 *
 * If either list runs out before the other, the remainder of the longer list
 * is appended in order. Cadence must be >= 1.
 */
function interleave<T>(primary: T[], secondary: T[], cadence: number): T[] {
  const out: T[] = [];
  let p = 0;
  let s = 0;
  while (p < primary.length || s < secondary.length) {
    for (let i = 0; i < cadence && p < primary.length; i++) {
      out.push(primary[p++]);
    }
    if (s < secondary.length) {
      out.push(secondary[s++]);
    }
  }
  return out;
}

// Get featured products (active + in stock only, curated category mix with
// brand-family interleave).
export async function getFeaturedProducts(count: number = 12): Promise<Product[]> {
  if (!hasPublicSupabaseEnv()) return [];
  const supabase = createPublicClient();

  const houseQueries = FEATURED_HOUSE_MIX.map(({ category, take }) =>
    supabase
      .from('products')
      .select(PRODUCT_COLUMNS)
      .eq('in_stock', true)
      .eq('is_active', true)
      .eq('category', category)
      .order('created_at', { ascending: false })
      .limit(take),
  );

  const lattafaQuery = supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .eq('in_stock', true)
    .eq('is_active', true)
    .eq('category', 'lattafa-original')
    .order('created_at', { ascending: false })
    .limit(FEATURED_LATTAFA_TAKE);

  const [houseResults, lattafaResult] = await Promise.all([
    Promise.all(houseQueries),
    lattafaQuery,
  ]);

  const seen = new Set<string>();
  const house: Product[] = [];
  for (let i = 0; i < houseResults.length; i++) {
    const { data, error } = houseResults[i];
    if (error) {
      Sentry.addBreadcrumb({
        category: 'product-service',
        message: 'Error fetching featured products (house slot)',
        level: 'error',
        data: { error, slot: FEATURED_HOUSE_MIX[i].category },
      });
      continue;
    }
    for (const product of data ?? []) {
      if (seen.has(product.id)) continue;
      seen.add(product.id);
      if (!isDisallowedSampleSize(product.size)) house.push(product);
    }
  }

  const lattafa: Product[] = [];
  if (lattafaResult.error) {
    Sentry.addBreadcrumb({
      category: 'product-service',
      message: 'Error fetching featured products (lattafa slot)',
      level: 'error',
      data: { error: lattafaResult.error },
    });
  } else {
    for (const product of lattafaResult.data ?? []) {
      if (seen.has(product.id)) continue;
      seen.add(product.id);
      if (!isDisallowedSampleSize(product.size)) lattafa.push(product);
    }
  }

  // Cadence 2 puts a Lattafa card at positions 2, 5, 8, 11 (0-indexed),
  // matching the 8:4 ratio at 12 cards.
  const picked = interleave(house, lattafa, 2).slice(0, count);

  // Backfill from newest-overall if any category came up short.
  if (picked.length < count) {
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_COLUMNS)
      .eq('in_stock', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(count * 2);

    if (error) {
      Sentry.addBreadcrumb({
        category: 'product-service',
        message: 'Error fetching featured-products backfill',
        level: 'error',
        data: { error },
      });
    }

    for (const product of data ?? []) {
      if (seen.has(product.id)) continue;
      seen.add(product.id);
      if (isDisallowedSampleSize(product.size)) continue;
      picked.push(product);
      if (picked.length >= count) break;
    }
  }

  return picked.slice(0, count);
}

// Get all product slugs for static generation
export async function getAllProductSlugs(): Promise<string[]> {
  if (!hasPublicSupabaseEnv()) return [];
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('products')
    .select('id, size');

  if (error) {
    Sentry.addBreadcrumb({ category: 'product-service', message: 'Error fetching product slugs', level: 'error', data: { error } });
    return [];
  }

  return filterPublicProducts(data).map(p => p.id);
}

// Get all product slugs with their updated_at timestamp for sitemap lastModified
export async function getAllProductSlugsForSitemap(): Promise<Array<{ id: string; updated_at: string | null }>> {
  if (!hasPublicSupabaseEnv()) return [];
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('products')
    .select('id, updated_at, size');

  if (error) {
    Sentry.addBreadcrumb({ category: 'product-service', message: 'Error fetching product slugs for sitemap', level: 'error', data: { error } });
    return [];
  }

  return filterPublicProducts(data).map(p => ({ id: p.id, updated_at: p.updated_at }));
}

// Get related products (same category, excluding current, active only)
// Requires category parameter to avoid N+1 query (caller must pass product.category)
export async function getRelatedProducts(
  productId: string,
  category: ProductCategory,
  count: number = 4
): Promise<Product[]> {
  if (!hasPublicSupabaseEnv()) return [];
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .eq('category', category)
    .eq('is_active', true)
    .neq('id', productId)
    .limit(count);

  if (error) {
    Sentry.addBreadcrumb({ category: 'product-service', message: 'Error fetching related products', level: 'error', data: { error, productId, category } });
    return [];
  }

  return filterPublicProducts(data);
}

// Search products (active only, sanitized against PostgREST injection)
export async function searchProducts(query: string): Promise<Product[]> {
  if (!hasPublicSupabaseEnv()) return [];
  const supabase = createPublicClient();
  const escaped = escapePostgrestQuery(query);
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .eq('is_active', true)
    .or(`name.ilike.%${escaped}%,description.ilike.%${escaped}%,brand.ilike.%${escaped}%`)
    .order('created_at', { ascending: false });

  if (error) {
    Sentry.addBreadcrumb({ category: 'product-service', message: 'Error searching products', level: 'error', data: { error, query } });
    return [];
  }

  return filterPublicProducts(data);
}

/**
 * Distinct brand list for the shop filter, derived from the live catalogue.
 *
 * Returns every non-empty `brand` value on active in-stock perfumes, slugified
 * for the URL contract, with display labels (original casing) and the
 * per-brand product count. Sorted by count desc, then label asc. Empty brand
 * cells are dropped — they would produce an unnameable filter row.
 *
 * Cached across server requests so dynamic shop pages do not rebuild this
 * derived list from Supabase for every filter URL.
 */
async function fetchAllProductBrands(): Promise<Array<{ id: string; label: string; count: number }>> {
  if (!hasPublicSupabaseEnv()) return [];
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('products')
    .select('brand')
    .eq('is_active', true)
    .eq('in_stock', true)
    .not('brand', 'is', null);

  if (error) {
    Sentry.addBreadcrumb({
      category: 'product-service',
      message: 'Error fetching brand list',
      level: 'error',
      data: { error },
    });
    return [];
  }

  // Group by slug, keep the first-seen label so casing matches the catalogue
  // even when individual rows are inconsistent ("LATTAFA" vs "Lattafa").
  const buckets = new Map<string, { label: string; count: number }>();
  for (const row of data ?? []) {
    const raw = (row.brand ?? '').trim();
    if (!raw) continue;
    const id = slugify(raw);
    if (!id) continue;
    const existing = buckets.get(id);
    if (existing) {
      existing.count += 1;
    } else {
      buckets.set(id, { label: raw, count: 1 });
    }
  }

  return Array.from(buckets.entries())
    .map(([id, { label, count }]) => ({ id, label, count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.label.localeCompare(b.label);
    });
}

export const getAllProductBrands = unstable_cache(
  fetchAllProductBrands,
  ['all-product-brands-v1'],
  {
    revalidate: PRODUCT_LIST_REVALIDATE_SECONDS,
    tags: ['products', 'product-brands'],
  },
);

// Get category by slug
export function getCategoryBySlug(slug: string) {
  return categories.find((c) => c.slug === slug);
}

// Get all categories
export function getAllCategories() {
  return categories;
}
