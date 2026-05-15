'use client';

import { Button } from '@/components/ui';
import { useCart } from '@/components/cart/CartProvider';
import StickyATC from './StickyATC';
import type { Product } from '@/lib/supabase/types';
import type { ProductSize, ProductType } from '@/types/product';

export interface ProductActionsProps {
  product: Product;
  price: number;
}

const VALID_SIZES = new Set(['10ml', '50ml', '100ml', '150ml']);

function normalizeSize(size: string): ProductSize {
  return VALID_SIZES.has(size) ? (size as ProductSize) : '50ml';
}

export function ProductActions({ product, price }: ProductActionsProps) {
  const { addItem } = useCart();
  const inStock = product.in_stock ?? true;

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      variantId: `${product.id}-${product.product_type}-${product.size}`,
      quantity: 1,
      name: product.name,
      image: product.image,
      price,
      size: normalizeSize(product.size),
      productType: product.product_type as ProductType,
    });
  };

  return (
    <>
      <div className="hidden md:block">
        <Button
          size="lg"
          onClick={handleAddToCart}
          disabled={!inStock}
          className="w-full"
        >
          Add to bag
        </Button>
      </div>
      <StickyATC
        price={price}
        productName={product.name}
        onAddToCart={handleAddToCart}
        disabled={!inStock}
      />
    </>
  );
}

export default ProductActions;
