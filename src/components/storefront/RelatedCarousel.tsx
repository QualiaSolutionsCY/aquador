'use client';

import { KeyboardEvent, useRef } from 'react';
import { Skeleton } from '@/components/ui';
import { ProductCard } from '@/components/ui/ProductCard';
import type { Product } from '@/lib/supabase/types';

export interface RelatedCarouselProps {
  products: Product[];
}

export function RelatedCarousel({ products }: RelatedCarouselProps) {
  const listRef = useRef<HTMLUListElement | null>(null);

  const handleKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;

    event.preventDefault();
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    listRef.current?.scrollBy({ left: direction * 300, behavior: 'smooth' });
  };

  return (
    <section
      aria-labelledby="related-heading"
      className="border-t border-border px-[var(--page-px)] py-16 md:py-24"
    >
      <h2
        id="related-heading"
        className="font-display text-[length:var(--font-h2)] leading-tight text-fg"
      >
        More from this register
      </h2>

      <ul
        ref={listRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="mt-8 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-6 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        {products.length === 0
          ? Array.from({ length: 3 }).map((_, index) => (
              <li key={index} className="min-w-[260px] snap-start sm:min-w-[280px]">
                <Skeleton variant="rect" className="aspect-[4/5] w-full" />
                <Skeleton className="mt-4 w-3/4" />
                <Skeleton className="mt-2 w-1/2" />
              </li>
            ))
          : products.map((product) => (
              <li
                key={product.id}
                className="min-w-[260px] snap-start transition-transform duration-[var(--duration-fast)] ease-[var(--ease-out-quart)] hover:-translate-y-0.5 sm:min-w-[280px]"
              >
                <ProductCard product={product} variant="compact" />
              </li>
            ))}
      </ul>
    </section>
  );
}

export default RelatedCarousel;
