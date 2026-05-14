import { formatPrice } from '@/lib/currency';
import RichDescription from './RichDescription';
import type { Product } from '@/types';

interface ProductInfoProps {
  product: Product;
}

const productTypeLabels: Record<string, string> = {
  'perfume': 'Perfume',
  'essence-oil': 'Essence Oil',
  'body-lotion': 'Body Lotion',
};

export default function ProductInfo({ product }: ProductInfoProps) {
  const inStock = product.in_stock ?? true;

  return (
    <div className="space-y-8">
      {/* Brand */}
      {product.brand && (
        <p className="text-[clamp(0.625rem,0.5625rem+0.3125vw,0.75rem)] text-gold-500 uppercase tracking-[0.15em]">
          {product.brand}
        </p>
      )}

      {/* Name */}
      <h1 className="text-[clamp(2rem,1.5rem+2.5vw,3.5rem)] font-playfair font-semibold text-black tracking-tight">
        {product.name}
      </h1>

      {/* Price */}
      <div className="flex items-baseline gap-4">
        {product.sale_price && product.sale_price < product.price ? (
          <>
            <span className="text-[clamp(2rem,1.75rem+1.25vw,2.75rem)] font-playfair font-medium text-gold-600">
              {formatPrice(product.sale_price)}
            </span>
            <span className="text-lg text-gray-500 line-through">
              {formatPrice(product.price)}
            </span>
          </>
        ) : (
          <span className="text-[clamp(2rem,1.75rem+1.25vw,2.75rem)] font-playfair font-medium text-gold-600">
            {formatPrice(product.price)}
          </span>
        )}
      </div>

      {/* Product Details */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="px-5 py-2.5 bg-white/80 backdrop-blur-sm rounded-full border border-gray-800/20">
          <span className="text-gray-400">Type: </span>
          <span className="text-black">{productTypeLabels[product.product_type]}</span>
        </div>
        <div className="px-5 py-2.5 bg-white/80 backdrop-blur-sm rounded-full border border-gray-800/20">
          <span className="text-gray-400">Size: </span>
          <span className="text-black">{product.size}</span>
        </div>
        <div className="px-5 py-2.5 bg-white/80 backdrop-blur-sm rounded-full border border-gray-800/20">
          <span className="text-gray-400">Status: </span>
          <span className={inStock ? 'text-green-400' : 'text-red-400'}>
            {inStock ? 'In Stock' : 'Coming Soon'}
          </span>
        </div>
      </div>

      {/* Description */}
      <div className="pt-6 border-t border-gray-300">
        <h3 className="text-[clamp(0.75rem,0.6875rem+0.3125vw,0.875rem)] text-gray-600 uppercase tracking-[0.1em] mb-3">
          Description
        </h3>
        <RichDescription description={product.description} />
      </div>

      {/* Tags */}
      {product.tags && product.tags.length > 0 && (
        <div className="pt-6 border-t border-gray-300">
          <h3 className="text-[clamp(0.75rem,0.6875rem+0.3125vw,0.875rem)] text-gray-600 uppercase tracking-[0.1em] mb-3">
            Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {product.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-xs text-gold bg-gold/10 rounded-full"
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
