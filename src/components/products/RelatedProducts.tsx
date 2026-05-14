'use client';

import { motion } from 'framer-motion';
import { ProductCard } from '@/components/ui/ProductCard';
import type { Product } from '@/types';

interface RelatedProductsProps {
  products: Product[];
}

export default function RelatedProducts({ products }: RelatedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section className="mt-20 pt-12 border-t border-gray-300">
      <h2 className="text-[clamp(1.75rem,1.5rem+1.25vw,2.5rem)] font-playfair font-semibold tracking-tight text-black mb-8 text-center">
        You May Also Like
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-[var(--spacing-md)] md:gap-[var(--spacing-lg)]">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <ProductCard product={product} variant="compact" />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
