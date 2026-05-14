'use client';

import { useState } from 'react';
import { formatPrice } from '@/lib/currency';
import ProductVariantSelector, {
  getDefaultVariant,
  type SelectedVariant,
} from './ProductVariantSelector';
import AddToCartButton from './AddToCartButton';
import RichDescription from './RichDescription';
import type { Product } from '@/types';

// Aquador's own fragrances support perfume / essence oil / body lotion variants
const AQUADOR_CATEGORIES = ['women', 'men', 'niche'];

const productTypeLabel = (type: string) => {
  if (type === 'essence-oil') return 'Essence Oil';
  if (type === 'body-lotion') return 'Body Lotion';
  return 'Perfume';
};

interface ProductDetailsProps {
  product: Product;
}

export default function ProductDetails({ product }: ProductDetailsProps) {
  const isAquador = AQUADOR_CATEGORIES.includes(product.category);
  const [variant, setVariant] = useState<SelectedVariant>(getDefaultVariant);

  // Aquador products: use selected variant price/type/size
  // Branded products: use exact DB price/type/size
  const displayProduct: Product = isAquador
    ? { ...product, price: variant.price, sale_price: null, product_type: variant.type, size: variant.size }
    : product;

  const displayPrice = isAquador
    ? variant.price
    : (product.sale_price && product.sale_price < product.price ? product.sale_price : product.price);

  const inStock = product.in_stock ?? true;

  return (
    <div className="flex flex-col gap-6">
      {/* Brand */}
      {product.brand && (
        <p className="text-[10px] text-gold/60 uppercase tracking-[0.25em] font-light">
          {product.brand}
        </p>
      )}

      {/* Name */}
      <h1 className="text-[clamp(1.75rem,1.25rem+2.5vw,3rem)] font-playfair font-normal text-black tracking-wide leading-[1.1]">
        {product.name}
      </h1>

      {/* Price */}
      <div className="flex items-baseline gap-3 transition-all duration-300">
        <span className="text-[clamp(1.75rem,1.5rem+1.25vw,2.5rem)] font-playfair font-normal text-gold">
          {formatPrice(displayPrice)}
        </span>
        {isAquador ? (
          <span className="text-sm text-gray-400">{variant.label} · {variant.size}</span>
        ) : (
          <span className="text-sm text-gray-400">
            {productTypeLabel(product.product_type)} · {product.size}
            {product.sale_price && product.sale_price < product.price && (
              <span className="ml-2 line-through text-gray-300">{formatPrice(product.price)}</span>
            )}
          </span>
        )}
      </div>

      {/* Variant selector — Aquador products only */}
      {isAquador && <ProductVariantSelector selected={variant} onChange={setVariant} />}

      {/* Stock + Add to Cart */}
      <div className="flex items-center gap-3 text-sm">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs ${
          inStock
            ? 'bg-emerald-50 text-emerald-600'
            : 'bg-red-50 text-red-500'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${inStock ? 'bg-emerald-500' : 'bg-red-400'}`} />
          {inStock ? 'In Stock' : 'Coming Soon'}
        </span>
      </div>

      <AddToCartButton product={displayProduct} />

      {/* Compact info row */}
      <div className="flex flex-wrap gap-4 pt-3 border-t border-gold/10">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <svg className="w-3.5 h-3.5 text-gold/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          Free shipping over €35
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <svg className="w-3.5 h-3.5 text-gold/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Secure checkout
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <svg className="w-3.5 h-3.5 text-gold/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          1-2 day delivery
        </div>
      </div>

      {/* Description — below the fold */}
      <div className="pt-6 border-t border-gold/10">
        <h3 className="text-[10px] text-gold/50 uppercase tracking-[0.2em] mb-4">
          About this fragrance
        </h3>
        <RichDescription description={product.description} />
      </div>

      {/* Tags */}
      {product.tags && product.tags.length > 0 && (
        <div className="pt-4 border-t border-gold/10">
          <div className="flex flex-wrap gap-2">
            {product.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1.5 text-[10px] uppercase tracking-[0.1em] text-gold/70 bg-gold/5 border border-gold/15"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
