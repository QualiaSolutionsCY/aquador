'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui';
import { useCart } from '@/components/cart/CartProvider';
import { formatPrice } from '@/lib/currency';
import StickyATC from './StickyATC';
import type { Product } from '@/lib/supabase/types';
import type { ProductSize, ProductType } from '@/types/product';

export interface ProductActionsProps {
  product: Product;
  variants?: Product[];
}

const VALID_SIZES = new Set(['10ml', '50ml', '100ml', '150ml']);
const TYPE_LABELS: Record<ProductType, string> = {
  perfume: 'Perfume',
  'essence-oil': 'Essence Oil',
  'body-lotion': 'Body Lotion',
};
const TYPE_ORDER: ProductType[] = ['perfume', 'essence-oil', 'body-lotion'];

function normalizeSize(size: string): ProductSize {
  return VALID_SIZES.has(size) ? (size as ProductSize) : '50ml';
}

function getDisplayPrice(product: Product): number {
  return product.sale_price && product.sale_price < product.price
    ? product.sale_price
    : product.price;
}

function getProductType(product: Product): ProductType {
  return product.product_type as ProductType;
}

export function ProductActions({ product, variants = [product] }: ProductActionsProps) {
  const { addItem } = useCart();
  const availableVariants = useMemo(
    () => variants.length > 0 ? variants : [product],
    [product, variants],
  );
  const initialId = availableVariants.some((variant) => variant.id === product.id) ? product.id : availableVariants[0]?.id;
  const [selectedId, setSelectedId] = useState(initialId);
  const selectedProduct = availableVariants.find((variant) => variant.id === selectedId) ?? availableVariants[0] ?? product;
  const selectedType = getProductType(selectedProduct);
  const selectedPrice = getDisplayPrice(selectedProduct);
  const inStock = selectedProduct.in_stock ?? true;
  const ctaLabel = inStock ? 'Add to bag' : 'Out of stock';

  const variantsByType = useMemo(() => {
    return availableVariants.reduce((map, variant) => {
      const type = getProductType(variant);
      const list = map.get(type) ?? [];
      list.push(variant);
      list.sort((a, b) => Number.parseFloat(a.size) - Number.parseFloat(b.size));
      map.set(type, list);
      return map;
    }, new Map<ProductType, Product[]>());
  }, [availableVariants]);

  function selectType(type: ProductType) {
    const firstVariant = variantsByType.get(type)?.[0];
    if (firstVariant) setSelectedId(firstVariant.id);
  }

  const handleAddToCart = () => {
    addItem({
      productId: selectedProduct.id,
      variantId: `${selectedProduct.id}-${selectedProduct.product_type}-${selectedProduct.size}`,
      quantity: 1,
      name: selectedProduct.name,
      image: selectedProduct.image,
      price: selectedPrice,
      size: normalizeSize(selectedProduct.size),
      productType: selectedProduct.product_type as ProductType,
    });
  };

  return (
    <>
      <div className="mb-5 flex flex-wrap items-baseline gap-3">
        <p className="font-display text-[length:var(--font-h2)] text-fg">
          {formatPrice(selectedPrice)}
        </p>
        {selectedProduct.sale_price && selectedProduct.sale_price < selectedProduct.price && (
          <p className="font-body text-[length:var(--font-size-body-sm)] text-fg-muted line-through">
            {formatPrice(selectedProduct.price)}
          </p>
        )}
        <p className="font-micro text-[length:var(--font-size-micro)] uppercase tracking-[0.05em] text-fg-muted">
          {TYPE_LABELS[selectedType]} · {selectedProduct.size}
        </p>
      </div>

      {availableVariants.length > 1 ? (
        <div className="mb-5 space-y-4">
          <div>
            <p className="mb-2 font-micro text-[length:var(--font-size-micro)] uppercase tracking-[0.05em] text-fg-muted">
              Product type
            </p>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Product type">
              {TYPE_ORDER.map((type) => {
                const isAvailable = variantsByType.has(type);
                const isSelected = selectedType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => selectType(type)}
                    disabled={!isAvailable}
                    aria-pressed={isSelected}
                    className={[
                      'min-h-11 rounded-sm border px-3 py-2 font-micro text-[11px] uppercase tracking-[0.05em] transition-colors',
                      isSelected
                        ? 'border-fg bg-fg text-bg'
                        : 'border-border-strong bg-bg text-fg hover:border-fg',
                      !isAvailable ? 'cursor-not-allowed opacity-40 hover:border-border-strong' : '',
                    ].join(' ')}
                  >
                    {TYPE_LABELS[type]}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 font-micro text-[length:var(--font-size-micro)] uppercase tracking-[0.05em] text-fg-muted">
              Size
            </p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Size">
              {(variantsByType.get(selectedType) ?? []).map((variant) => {
                const price = getDisplayPrice(variant);
                const isSelected = selectedProduct.id === variant.id;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => setSelectedId(variant.id)}
                    aria-pressed={isSelected}
                    className={[
                      'min-h-11 rounded-sm border px-4 py-2 text-left transition-colors',
                      isSelected
                        ? 'border-fg bg-bg-alt text-fg'
                        : 'border-border-strong bg-bg text-fg hover:border-fg',
                    ].join(' ')}
                  >
                    <span className="block font-body text-[14px]">{variant.size}</span>
                    <span className="block font-micro text-[11px] uppercase tracking-[0.05em] text-fg-muted">
                      {formatPrice(price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      <div>
        <Button
          size="lg"
          onClick={handleAddToCart}
          disabled={!inStock}
          className="w-full"
        >
          {ctaLabel}
        </Button>
      </div>
      <StickyATC
        price={selectedPrice}
        productName={selectedProduct.name}
        onAddToCart={handleAddToCart}
        disabled={!inStock}
        label={ctaLabel}
      />
    </>
  );
}

export default ProductActions;
