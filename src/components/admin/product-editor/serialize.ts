/**
 * Form ↔ DB serialization for ProductEditor.
 *
 * `buildDefaults` converts a `products` Row (or null for create mode) into
 * the RHF form values. `toPayload` converts form values back into the
 * payload `/api/admin/products` expects. Kept separate from the editor
 * component so unit tests can pin the serialization logic without React.
 */

import type { Product } from '@/lib/supabase/types';
import type { ProductFormValues } from './schema';
import { sanitizeDescriptionHtml } from '@/lib/product-description';

export const FEATURED_TAG = 'featured';

export function buildDefaults(product: Product | null): ProductFormValues {
  const tags = (product?.tags ?? []).filter((t) => t && t !== FEATURED_TAG);
  return {
    name: product?.name ?? '',
    brand: product?.brand ?? '',
    category: (product?.category ?? 'women') as ProductFormValues['category'],
    product_type: (product?.product_type ?? 'perfume') as ProductFormValues['product_type'],
    gender: (product?.gender ?? '') as ProductFormValues['gender'],
    size: product?.size ?? '50ml',
    price: product?.price ?? 0,
    sale_price: product?.sale_price ?? '',
    in_stock: product?.in_stock ?? true,
    stock_quantity: product?.stock_quantity ?? 0,
    description: product?.description ?? '',
    image: product?.image ?? '',
    images: product?.images ?? [],
    tags,
    is_active: product?.is_active ?? true,
    featured: (product?.tags ?? []).includes(FEATURED_TAG),
  };
}

export function toPayload(values: ProductFormValues, productId?: string) {
  const mergedTags = values.featured ? [...values.tags, FEATURED_TAG] : values.tags;
  const salePrice =
    typeof values.sale_price === 'number' && Number.isFinite(values.sale_price)
      ? values.sale_price
      : null;
  return {
    id: productId,
    name: values.name,
    brand: values.brand || null,
    category: values.category,
    product_type: values.product_type,
    gender: values.gender === '' ? null : values.gender,
    size: values.size,
    price: values.price,
    sale_price: salePrice,
    description: sanitizeDescriptionHtml(values.description),
    image: values.image,
    images: values.images,
    tags: mergedTags.length > 0 ? Array.from(new Set(mergedTags)) : null,
    stock_quantity: values.stock_quantity,
    // Availability flag is derived from the manual count — never a separate toggle.
    in_stock: values.stock_quantity > 0,
    is_active: values.is_active,
  };
}
