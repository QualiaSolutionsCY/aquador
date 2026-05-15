import { cache } from 'react';
import * as Sentry from '@sentry/nextjs';
import { createPublicClient } from './public';
import type { Product, ProductCategory } from './types';
import { categories } from '../categories';

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

// Get featured products (active + in stock only)
export async function getFeaturedProducts(count: number = 6): Promise<Product[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .eq('in_stock', true)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(count);

  if (error) {
    Sentry.addBreadcrumb({ category: 'product-service', message: 'Error fetching featured products', level: 'error', data: { error } });
    return [];
  }

  return data || [];
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

// Get category by slug
export function getCategoryBySlug(slug: string) {
  return categories.find((c) => c.slug === slug);
}

// Get all categories
export function getAllCategories() {
  return categories;
}
