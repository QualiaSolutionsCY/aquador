/**
 * Shared Zod schema + types for the sectioned Product Editor.
 *
 * Lives at the section root so every section file can import the same
 * `ProductFormValues` without circular imports through ProductEditor.tsx.
 * Field shape mirrors `products` columns in src/lib/supabase/types.ts; any
 * column missing from the DB (e.g. `slug`, `compare_at_price`) is
 * deliberately omitted — there is no place to persist it.
 */

import { z } from 'zod';

export const PRODUCT_CATEGORIES = [
  { value: 'women', label: "Women's Collection" },
  { value: 'men', label: "Men's Collection" },
  { value: 'niche', label: 'Niche' },
  { value: 'essence-oil', label: 'Essence Oil' },
  { value: 'body-lotion', label: 'Body Lotion' },
  { value: 'lattafa-original', label: 'Lattafa Originals' },
  { value: 'al-haramain-originals', label: 'Al Haramain Originals' },
  { value: 'victorias-secret-originals', label: "Victoria's Secret Originals" },
] as const;

export const PRODUCT_TYPES = [
  { value: 'perfume', label: 'Perfume' },
  { value: 'essence-oil', label: 'Essence Oil' },
  { value: 'body-lotion', label: 'Body Lotion' },
] as const;

export const PRODUCT_GENDERS = [
  { value: 'women', label: 'Women' },
  { value: 'men', label: 'Men' },
  { value: 'unisex', label: 'Unisex' },
] as const;

export const PRODUCT_SIZES = ['10ml', '50ml', '60ml', '100ml', '150ml', '200ml'] as const;

export const productFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  brand: z.string().max(120),
  category: z.enum([
    'women',
    'men',
    'niche',
    'essence-oil',
    'body-lotion',
    'lattafa-original',
    'al-haramain-originals',
    'victorias-secret-originals',
  ]),
  product_type: z.enum(['perfume', 'essence-oil', 'body-lotion']),
  gender: z.union([z.enum(['women', 'men', 'unisex']), z.literal('')]),
  size: z.string().min(1, 'Size is required').refine((value) => value.trim().toLowerCase() !== '2ml', {
    message: '2ml samples are no longer available',
  }),

  price: z
    .number({ error: 'Price must be a number' })
    .min(0, 'Price must be ≥ 0'),
  sale_price: z
    .union([z.number().min(0, 'Sale price must be ≥ 0'), z.nan(), z.literal('')])
    .optional(),
  in_stock: z.boolean(),

  description: z.string().min(1, 'Description is required'),

  image: z.string().url('Primary image must be a valid URL'),
  images: z.array(z.string().url('Each image must be a valid URL')).max(10),

  tags: z.array(z.string().min(1).max(40)).max(20),

  is_active: z.boolean(),
  featured: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
