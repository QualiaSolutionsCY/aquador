/**
 * ProductGrid. Server-rendered product result grid with a small client
 * controls island for URL filter writes.
 */

import { ProductCard } from '@/components/ui/ProductCard';
import {
  applyShopFilters,
  applyShopSort,
  parseShopFilters,
  type ShopFilters,
} from '@/lib/shop/filter-schema';
import type { Product } from '@/lib/supabase/types';
import ProductGridFrame from './ProductGridFrame';
import type { BrandOption, CategoryOption } from './FilterPanel';

export type ProductGridSearchParams = Record<
  string,
  string | string[] | undefined
>;

export interface ProductGridProps {
  products: Product[];
  brandOptions: BrandOption[];
  categoryOptions: CategoryOption[];
  categorySlug?: string;
  searchParams?: ProductGridSearchParams;
}

function toUrlSearchParams(params: ProductGridSearchParams = {}): URLSearchParams {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      if (value.length > 0) out.set(key, value.join(','));
    } else if (typeof value === 'string' && value.length > 0) {
      out.set(key, value);
    }
  }
  return out;
}

export default function ProductGrid({
  products,
  brandOptions,
  categoryOptions,
  categorySlug,
  searchParams,
}: ProductGridProps) {
  const filters: ShopFilters = parseShopFilters(toUrlSearchParams(searchParams));
  const visible = applyShopSort(
    applyShopFilters(products, filters),
    filters.sort ?? 'featured',
  );

  return (
    <ProductGridFrame
      filters={filters}
      brandOptions={brandOptions}
      categoryOptions={categoryOptions}
      categorySlug={categorySlug}
      resultCount={visible.length}
    >
      <ul className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        {visible.map((product, index) => (
          <li key={product.id}>
            <ProductCard product={product} priority={index < 4} />
          </li>
        ))}
      </ul>
    </ProductGridFrame>
  );
}
