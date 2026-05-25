/**
 * ProductCard - server-renderable product tile used by shop grids and
 * related-product rails.
 */

import Link from 'next/link';
import { formatPrice } from '@/lib/currency';
import { Badge } from '@/components/ui/Badge';
import { ProductImage } from './ProductImage';
import type { Product } from '@/lib/supabase/types';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
  variant?: 'default' | 'compact';
}

function extractFragranceNotes(tags: string[] | null): string[] {
  if (!tags) return [];
  return tags
    .filter((tag) => tag.startsWith('note-'))
    .map((tag) => {
      const note = tag.replace('note-', '');
      return note.charAt(0).toUpperCase() + note.slice(1);
    })
    .slice(0, 5);
}

function plainDescription(description: string): string {
  const plain = description.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  return plain.length > 80 ? `${plain.slice(0, 80)}...` : plain;
}

export function ProductCard({ product, priority = false, variant = 'default' }: ProductCardProps) {
  const inStock = product.in_stock ?? true;
  const salePrice = product.sale_price;
  const isOnSale = !!salePrice && inStock;
  const displayPrice = salePrice || product.price;
  const notes = extractFragranceNotes(product.tags);

  const isCompact = variant === 'compact';
  const padding = isCompact ? 'p-3 md:p-4' : 'p-4 md:p-5';
  const brandSize = isCompact
    ? 'text-[0.5625rem]'
    : 'text-[clamp(0.625rem,0.5625rem+0.3125vw,0.75rem)]';
  const nameSize = isCompact
    ? 'text-[0.875rem] md:text-[1rem]'
    : 'text-[clamp(1rem,0.875rem+0.625vw,1.25rem)]';
  const priceSize = isCompact
    ? 'text-[1rem] md:text-[1.125rem]'
    : 'text-[clamp(1.125rem,1rem+0.625vw,1.5rem)]';

  return (
    <Link
      href={`/products/${product.id}`}
      className={`group/card relative block border border-border-strong bg-bg-alt ${padding} transition-[border-color,transform,opacity] duration-[var(--duration-base)] ease-[var(--ease-out-quart)] hover:-translate-y-0.5 hover:border-border-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
        !inStock ? 'opacity-75' : ''
      }`}
      aria-label={`View ${product.name}`}
      prefetch={false}
    >
      <div className="relative mb-3 aspect-[4/5] overflow-hidden md:mb-4">
        <ProductImage
          src={product.image}
          alt={product.name}
          variant="card"
          priority={priority}
          className="h-full w-full object-contain p-4 transition-transform duration-[var(--duration-base)] ease-[var(--ease-out-quart)] group-hover/card:scale-[1.03]"
        />

        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-end overflow-hidden opacity-0 transition-opacity duration-[var(--duration-base)] ease-[var(--ease-out-quart)] group-hover/card:opacity-100 group-focus-visible/card:opacity-100">
          <div className="absolute inset-x-0 bottom-0 h-3/4 bg-[linear-gradient(to_top,var(--scrim),transparent)]" />
          <div className="relative z-10 space-y-2 p-3 md:p-4">
            <p className="line-clamp-2 text-[11px] leading-relaxed text-bg">
              {plainDescription(product.description)}
            </p>
            {notes.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {notes.map((note) => (
                  <span
                    key={note}
                    className="border border-bg/35 bg-bg/10 px-2 py-0.5 font-micro text-[9px] uppercase tracking-[0.08em] text-bg"
                  >
                    {note}
                  </span>
                ))}
              </div>
            ) : null}
            <span
              aria-hidden="true"
              className="inline-block border border-bg/50 px-3 py-1.5 font-micro text-[10px] uppercase tracking-[0.08em] text-bg md:text-[11px]"
            >
              Open perfume
            </span>
          </div>
        </div>

        {isOnSale ? (
          <Badge variant="accent" className="absolute right-3 top-3 z-20">
            Sale
          </Badge>
        ) : null}

        {!inStock ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--scrim)]">
            <Badge variant="neutral">Out of stock</Badge>
          </div>
        ) : null}
      </div>

      <div className="min-h-[7rem] space-y-2">
        <p
          className={`${brandSize} font-micro font-medium uppercase tracking-[0.15em] text-fg-muted ${
            !product.brand ? 'invisible' : ''
          }`}
        >
          {product.brand || ' '}
        </p>

        <h3 className={`${nameSize} line-clamp-2 font-display font-medium leading-tight text-fg`}>
          {product.name}
        </h3>

        <div className="flex items-baseline gap-2 pt-1">
          <span className={`${priceSize} font-display font-medium text-fg`}>
            {formatPrice(displayPrice)}
          </span>
          {isOnSale ? (
            <span className="text-sm text-fg-muted line-through">
              {formatPrice(product.price)}
            </span>
          ) : null}
        </div>

        {product.size ? (
          <p className="font-micro text-[10px] uppercase tracking-wider text-fg-muted">
            {product.size}
          </p>
        ) : null}
      </div>

      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-accent transition-transform duration-[var(--duration-base)] ease-[var(--ease-out-quart)] group-hover/card:scale-x-100"
      />
    </Link>
  );
}
