/**
 * ProductCard — v3.0 token-driven card surface (M3 P4 T3).
 *
 * Editorial product tile used by FeaturedGrid, RelatedCarousel, DiscoveryGrid,
 * and ProductGrid. The card is intentionally restrained:
 *   - `bg-bg-alt` surface (parchment) with hairline `border-border` → strong
 *     border on hover, no shadow.
 *   - Display font for the product name (Cormorant Garamond via --font-display).
 *   - Sale chip uses the canonical <Badge variant="accent"> instead of the old
 *     bespoke `bg-black` chip with custom gold text.
 *   - Out-of-stock state shows a single Badge inside a subtle scrim — no
 *     blurred white card layered on top.
 *   - Accent underline scales from 0 to 1 on the X-axis at the card's bottom
 *     edge on hover (origin-left). Replaces the previous gold gradient sweep.
 *
 * Variants:
 *   - default  — used by ProductGrid / DiscoveryGrid (4-col shop layouts).
 *   - compact  — used by FeaturedGrid / RelatedCarousel (denser type scale).
 *
 * Hover crossfade for FeaturedGrid is handled by the parent <li> (which carries
 * its own `group` class) overlaying a sibling <HoverCrossfade> on top of this
 * card. ProductCard's internal `group` is therefore scoped to *its own* hover
 * effects (name underline) — see the named `group/card` Tailwind selector.
 */

'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatPrice } from '@/lib/currency';
import { Badge } from '@/components/ui/Badge';
import { ProductImage } from './ProductImage';
import { ProductQuickView } from '@/components/shop/ProductQuickView';
import { hoverVariants, tapVariants } from '@/lib/animations/micro-interactions';
import { imageZoomVariants } from '@/lib/animations/discovery-animations';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { preloadProduct } from '@/lib/preload/strategy';
import type { Product } from '@/lib/supabase/types';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
  variant?: 'default' | 'compact';
}

export function ProductCard({ product, priority = false, variant = 'default' }: ProductCardProps) {
  const reducedMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);
  const [isTapRevealed, setIsTapRevealed] = useState(false);
  const cancelPreloadRef = useRef<(() => void) | null>(null);

  const inStock = product.in_stock ?? true;
  const salePrice = product.sale_price;

  const isOnSale = !!salePrice && !!inStock;
  const displayPrice = salePrice || product.price;

  // Variant-specific sizing
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

  const cardHover = reducedMotion ? { scale: 1.01 } : hoverVariants.lift;
  const cardTap = reducedMotion ? { scale: 0.98 } : tapVariants.shrink;

  return (
    <motion.div
      whileHover={cardHover}
      whileTap={cardTap}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={!inStock ? 'opacity-75' : ''}
    >
      <Link
        href={`/products/${product.id}`}
        className={`group/card relative block border border-border bg-bg-alt ${padding} transition-colors duration-[var(--duration-base)] ease-[var(--ease-out-quart)] hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg`}
        aria-label={`View ${product.name}`}
        onMouseEnter={() => {
          setIsHovered(true);
          cancelPreloadRef.current = preloadProduct(String(product.id));
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsTapRevealed(false);
          cancelPreloadRef.current?.();
          cancelPreloadRef.current = null;
        }}
        onClick={(e) => {
          // Mobile tap-to-reveal: first tap shows quick-view overlay, second tap navigates.
          if (window.matchMedia('(pointer: coarse)').matches) {
            if (!isTapRevealed) {
              e.preventDefault();
              setIsTapRevealed(true);
              setIsHovered(true);
            }
          }
        }}
      >
        {/* Product image */}
        <div className="relative mb-3 aspect-[4/5] overflow-hidden md:mb-4">
          <motion.div
            variants={reducedMotion ? {} : imageZoomVariants}
            initial="rest"
            animate={isHovered ? 'hover' : 'rest'}
            className="h-full"
          >
            <ProductImage
              src={product.image}
              alt={product.name}
              variant="card"
              priority={priority}
              className="h-full w-full object-cover"
            />
          </motion.div>

          {/* Quick-view overlay (renders its own scrim + actions) */}
          <ProductQuickView
            product={product}
            isVisible={isHovered}
            onClose={() => {
              setIsHovered(false);
              setIsTapRevealed(false);
            }}
          />

          {/* Sale chip — canonical Badge primitive */}
          {isOnSale && (
            <Badge variant="accent" className="absolute right-3 top-3">
              Sale
            </Badge>
          )}

          {/* Out-of-stock state — single neutral badge on a subtle scrim */}
          {!inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--scrim)]">
              <Badge variant="neutral">Out of stock</Badge>
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="min-h-[7rem] space-y-2">
          {/* Brand */}
          <p
            className={`${brandSize} font-micro font-medium uppercase tracking-[0.15em] text-fg-muted ${
              !product.brand ? 'invisible' : ''
            }`}
          >
            {product.brand || ' '}
          </p>

          {/* Name */}
          <h3
            className={`${nameSize} font-display font-medium leading-tight tracking-tight text-fg line-clamp-2`}
          >
            {product.name}
          </h3>

          {/* Price */}
          <div className="flex items-baseline gap-2 pt-1">
            <span className={`${priceSize} font-display font-medium text-fg`}>
              {formatPrice(displayPrice)}
            </span>
            {isOnSale && (
              <span className="text-sm text-fg-muted line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          {/* Size */}
          {product.size && (
            <p className="font-micro text-[10px] uppercase tracking-wider text-fg-muted">
              {product.size}
            </p>
          )}
        </div>

        {/* Accent underline — scales in on hover from the left edge */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-accent transition-transform duration-[var(--duration-base)] ease-[var(--ease-out-quart)] group-hover/card:scale-x-100"
        />
      </Link>
    </motion.div>
  );
}
