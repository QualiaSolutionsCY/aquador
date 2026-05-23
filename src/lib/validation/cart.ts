import { z } from 'zod';
import type { CartItem } from '@/types/cart';
import { getProductsByIds } from '@/lib/supabase/product-service';
import { MIN_QUANTITY, MAX_QUANTITY } from '@/lib/constants';
import { isDisallowedSampleSize } from '@/lib/product-description';

/**
 * Zod schema for CartItem validation
 *
 * Validates all cart item fields to prevent malformed data from being processed.
 * Used for server-side validation before creating Stripe checkout sessions.
 */
export const cartItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string()
    .min(1, 'Variant ID is required')
    .regex(
      /^(?:[a-z0-9-]+-(?:perfume|essence-oil|body-lotion)-(?:10ml|50ml|100ml|150ml)|custom-[a-z0-9-]+-perfume-(?:50ml|100ml))$/,
      'Variant ID must match pattern {productId}-{productType}-{size}'
    ),
  quantity: z.number()
    .int('Quantity must be an integer')
    .min(MIN_QUANTITY, `Quantity must be at least ${MIN_QUANTITY}`)
    .max(MAX_QUANTITY, `Quantity cannot exceed ${MAX_QUANTITY}`),
  name: z.string()
    .min(1, 'Product name is required')
    .max(200, 'Product name too long'),
  image: z.string().min(1, 'Product image is required'),
  price: z.number().positive('Price must be positive'),
  size: z.enum(['10ml', '50ml', '100ml', '150ml'] as const, {
    message: 'Invalid product size',
  }),
  productType: z.enum(['perfume', 'essence-oil', 'body-lotion'] as const, {
    message: 'Invalid product type',
  }),
  customPerfume: z.object({
    name: z.string().min(1).max(120),
    topNote: z.string().min(1).max(80),
    heartNote: z.string().min(1).max(80),
    baseNote: z.string().min(1).max(80),
    specialRequests: z.string().max(500).optional(),
  }).optional(),
});

/**
 * Validates cart items against the server-side product catalog and returns
 * corrected prices from the catalog.
 *
 * Security: Always uses catalog prices for checkout, never trusting client prices.
 * Uses batch query to avoid N+1 database calls.
 */
export async function validateCartPrices(items: CartItem[]): Promise<{
  valid: boolean;
  correctedItems?: CartItem[];
  errors?: Array<{ productId: string; reason: string }>;
}> {
  const errors: Array<{ productId: string; reason: string }> = [];

  // Batch fetch all products in a single query
  const productIds = items.map(item => item.productId);
  const products = await getProductsByIds(productIds);
  const productMap = new Map(products.map(p => [p.id, p]));

  const correctedItems: CartItem[] = [];

  for (const item of items) {
    if (isDisallowedSampleSize(item.size)) {
      errors.push({
        productId: item.productId,
        reason: '2ml samples are no longer available',
      });
      continue;
    }

    if (item.productId === 'custom-perfume') {
      if (!item.customPerfume) {
        errors.push({
          productId: item.productId,
          reason: 'Custom perfume details are required',
        });
        continue;
      }
      const customPrice = item.size === '100ml' ? 49.99 : 29.99;
      correctedItems.push({ ...item, price: customPrice, productType: 'perfume' });
      continue;
    }

    const product = productMap.get(item.productId);

    if (!product) {
      errors.push({
        productId: item.productId,
        reason: `Product not found in catalog`,
      });
      continue;
    }

    // Every buyable catalogue option is a product row. Type and size must
    // match the row selected on the PDP, then checkout uses the DB amount.
    if (item.productType !== product.product_type) {
      errors.push({
        productId: item.productId,
        reason: `Product type mismatch: client sent "${item.productType}", catalog has "${product.product_type}"`,
      });
      continue;
    }

    if (item.size !== product.size) {
      errors.push({
        productId: item.productId,
        reason: `Size mismatch: client sent "${item.size}", catalog has "${product.size}"`,
      });
      continue;
    }

    // Always use catalog price (sale price takes precedence)
    const catalogPrice = Number(product.sale_price ?? product.price);
    correctedItems.push({ ...item, price: catalogPrice });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, correctedItems };
}
