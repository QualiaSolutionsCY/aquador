import { cache } from 'react';
import * as Sentry from '@sentry/nextjs';
import { createPublicClient } from './public';
import type { Product, ProductCategory } from './types';
import { categories } from '../categories';
import { slugify } from '../utils';

// Re-export categories since they're static
export { categories };

/** Escape PostgREST special characters in search queries */
function escapePostgrestQuery(query: string): string {
  return query.replace(/[%_\\*()[\]!,]/g, '\\$&');
}

/** Explicit column selection for product queries (avoids select(*) overhead) */
const PRODUCT_COLUMNS = 'id, name, description, price, sale_price, image, images, category, product_type, gender, brand, size, tags, in_stock, is_active, created_at, updated_at' as const;

// Get all products from Supabase (public-facing, filters inactive)
export async function getAllProducts(): Promise<Product[]> {
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

  return data || [];
}

// Get product by ID (returns null if inactive)
export async function getProductById(id: string): Promise<Product | null> {
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

  return data;
}

// Batch fetch products by IDs (single query, no N+1)
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .in('id', ids);

  if (error) {
    Sentry.addBreadcrumb({ category: 'product-service', message: 'Error batch fetching products', level: 'error', data: { error, ids } });
    return [];
  }

  return data || [];
}

// Get product by slug — cached per request to dedup generateMetadata + page component calls
export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  return getProductById(slug);
});

// Get products by category (filters inactive)
export async function getProductsByCategory(category: string): Promise<Product[]> {
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

  return data || [];
}

// Curator's mix for the homepage featured grid. Without this the newest-first
// fallback pulls a single category (whichever was imported last) and the page
// reads as a one-brand catalogue instead of an editorial. The mix surfaces
// Aquad'or's curated lines (9 slots) alongside Lattafa (3 slots) so the
// homepage shows breadth, not a one-brand catalogue.
const FEATURED_MIX: ReadonlyArray<{ category: ProductCategory; take: number }> = [
  { category: 'niche', take: 3 },
  { category: 'essence-oil', take: 2 },
  { category: 'women', take: 2 },
  { category: 'men', take: 2 },
  { category: 'lattafa-original', take: 3 },
];

// Get featured products (active + in stock only, curated category mix).
export async function getFeaturedProducts(count: number = 12): Promise<Product[]> {
  const supabase = createPublicClient();

  const queries = FEATURED_MIX.map(({ category, take }) =>
    supabase
      .from('products')
      .select(PRODUCT_COLUMNS)
      .eq('in_stock', true)
      .eq('is_active', true)
      .eq('category', category)
      .order('created_at', { ascending: false })
      .limit(take),
  );

  const results = await Promise.all(queries);
  const picked: Product[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < results.length; i++) {
    const { data, error } = results[i];
    if (error) {
      Sentry.addBreadcrumb({
        category: 'product-service',
        message: 'Error fetching featured products (slot)',
        level: 'error',
        data: { error, slot: FEATURED_MIX[i].category },
      });
      continue;
    }
    for (const product of data ?? []) {
      if (seen.has(product.id)) continue;
      seen.add(product.id);
      picked.push(product);
      if (picked.length >= count) return picked;
    }
  }

  // Backfill from newest-overall if a category was empty and the mix came up
  // short. Keeps the grid full without re-introducing single-category bias.
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
      picked.push(product);
      if (picked.length >= count) break;
    }
  }

  return picked;
}

// Get all product slugs for static generation
export async function getAllProductSlugs(): Promise<string[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('products')
    .select('id');

  if (error) {
    Sentry.addBreadcrumb({ category: 'product-service', message: 'Error fetching product slugs', level: 'error', data: { error } });
    return [];
  }

  return (data || []).map(p => p.id);
}

// Get all product slugs with their updated_at timestamp for sitemap lastModified
export async function getAllProductSlugsForSitemap(): Promise<Array<{ id: string; updated_at: string | null }>> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('products')
    .select('id, updated_at');

  if (error) {
    Sentry.addBreadcrumb({ category: 'product-service', message: 'Error fetching product slugs for sitemap', level: 'error', data: { error } });
    return [];
  }

  return (data || []).map(p => ({ id: p.id, updated_at: p.updated_at }));
}

// Get related products (same category, excluding current, active only)
// Requires category parameter to avoid N+1 query (caller must pass product.category)
export async function getRelatedProducts(
  productId: string,
  category: ProductCategory,
  count: number = 4
): Promise<Product[]> {
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

  return data || [];
}

export async function getProductOrdersCount(
  productId: string,
  days: number
): Promise<number | null> {
  const supabase = createPublicClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('orders')
    .select('items')
    .gte('created_at', since);

  if (error) {
    Sentry.addBreadcrumb({
      category: 'product-service',
      message: 'Orders count unavailable for social proof',
      level: 'warning',
      data: { error, productId, days },
    });
    return null;
  }

  return (data || []).reduce((total, order) => {
    const items = Array.isArray(order.items) ? order.items : [];
    const matches = items.filter((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
      const record = item as Record<string, unknown>;
      return (
        record.productId === productId ||
        record.product_id === productId ||
        record.id === productId
      );
    });

    return total + matches.length;
  }, 0);
}

// Search products (active only, sanitized against PostgREST injection)
export async function searchProducts(query: string): Promise<Product[]> {
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

  return data || [];
}

/**
 * Distinct brand list for the shop filter, derived from the live catalogue.
 *
 * Returns every non-empty `brand` value on active in-stock perfumes, slugified
 * for the URL contract, with display labels (original casing) and the
 * per-brand product count. Sorted by count desc, then label asc. Empty brand
 * cells are dropped — they would produce an unnameable filter row.
 *
 * Cached per server request via `react.cache` so the shop page header,
 * filter panel, and any other consumer all hit one query per render.
 */
export const getAllProductBrands = cache(async (): Promise<
  Array<{ id: string; label: string; count: number }>
> => {
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
});

// Get category by slug
export function getCategoryBySlug(slug: string) {
  return categories.find((c) => c.slug === slug);
}

// Get all categories
export function getAllCategories() {
  return categories;
}
