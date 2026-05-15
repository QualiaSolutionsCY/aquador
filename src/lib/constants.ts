/**
 * Shared constants used across the application
 */

import type { ProductType } from '@/types/product';
import { categories } from '@/lib/categories';

/**
 * Human-readable labels for product types
 */
export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  'perfume': 'Perfume',
  'essence-oil': 'Essence Oil',
  'body-lotion': 'Body Lotion',
} as const;

/**
 * Get the label for a product type
 */
export function getProductTypeLabel(type: string): string {
  return PRODUCT_TYPE_LABELS[type as ProductType] || type;
}

/**
 * Allowed shipping countries for Stripe checkout
 */
export const SHIPPING_COUNTRIES = [
  'CY', 'GR', 'GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT',
] as const;

/**
 * Shipping configuration
 */
export const FREE_SHIPPING_THRESHOLD = 35; // EUR — orders at or above this get free shipping
export const DELIVERY_FEE = 3; // EUR — flat fee for orders below threshold

/**
 * Cart configuration constants
 */
export const CART_DEBOUNCE_MS = 500;
export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 99;
export const MAX_CART_ITEMS = 50;

/**
 * Shop filtering + sorting constants.
 *
 * These drive the shop page filter bar (SHOP-01) and sort dropdown (SHOP-02).
 * The IDs are URL-safe kebab-case slugs that round-trip through query params
 * via parseShopFilters / stringifyShopFilters in src/lib/shop/filter-schema.ts.
 *
 * To adjust price tiers, edit PRICE_BANDS here. The operator's tier story
 * lives in this single source of truth.
 */

/** Price bands used by the shop filter. max=null means open-ended (>= min). */
export const PRICE_BANDS = [
  { id: '0-30', label: 'Under 30', min: 0, max: 30 },
  { id: '30-60', label: '30 to 60', min: 30, max: 60 },
  { id: '60-100', label: '60 to 100', min: 60, max: 100 },
  { id: '100+', label: '100 and up', min: 100, max: null },
] as const;

export type PriceBandId = (typeof PRICE_BANDS)[number]['id'];

/** Sort dropdown options. 'featured' is the default sort. */
export const SORT_OPTIONS = [
  { id: 'featured', label: 'Featured' },
  { id: 'price-asc', label: 'Price low to high' },
  { id: 'price-desc', label: 'Price high to low' },
  { id: 'newest', label: 'Newest' },
] as const;

export type SortOptionId = (typeof SORT_OPTIONS)[number]['id'];

/** Gender filter options. Match products.gender enum values. */
export const GENDER_OPTIONS = [
  { id: 'women', label: 'Women' },
  { id: 'men', label: 'Men' },
  { id: 'unisex', label: 'Unisex' },
] as const;

export type GenderOptionId = (typeof GENDER_OPTIONS)[number]['id'];

/**
 * Brand filter options. Matched case-insensitively against products.brand.
 * IDs are kebab-case URL slugs; labels are display strings.
 */
export const BRAND_OPTIONS = [
  { id: 'lattafa', label: 'Lattafa' },
  { id: 'al-haramain', label: 'Al Haramain' },
  { id: 'victorias-secret', label: "Victoria's Secret" },
  { id: 'other', label: 'Other' },
] as const;

export type BrandOptionId = (typeof BRAND_OPTIONS)[number]['id'];

/**
 * Category filter options. Sourced from the canonical categories array
 * in src/lib/categories.ts so the homepage display and shop filter stay
 * in lockstep.
 */
export const CATEGORY_OPTIONS = categories.map((c) => ({
  id: c.slug,
  label: c.name,
}));

export type CategoryOptionId = (typeof CATEGORY_OPTIONS)[number]['id'];

/**
 * Fragrance family filter options. The five families used across the
 * custom-perfume builder and shop filter. Matched against products.tags
 * (lowercased).
 */
export const NOTES_FAMILY_OPTIONS = [
  { id: 'floral', label: 'Floral' },
  { id: 'fruity', label: 'Fruity' },
  { id: 'woody', label: 'Woody' },
  { id: 'oriental', label: 'Oriental' },
  { id: 'gourmand', label: 'Gourmand' },
] as const;

export type NotesFamilyId = (typeof NOTES_FAMILY_OPTIONS)[number]['id'];
