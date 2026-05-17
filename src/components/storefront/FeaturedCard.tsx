'use client';

/**
 * FeaturedCard. Per-card client leaf for the editorial FeaturedGrid spread
 * (POLISH-08, M4 P1 T3; re-redesigned M4 P-polish for a true magazine layout
 * with hero / medium / small classes instead of uniform tiles).
 *
 * Unlike the previous pass (which delegated to the compact ProductCard), each
 * emphasis here owns its own internal layout. That is the only way to get the
 * "big" cards to actually feel bigger than the "small" cards. Sharing a
 * ProductCard chassis forces the same vertical rhythm and the spread collapses
 * back into a CSV dump of similar tiles.
 *
 * Emphases:
 *   - hero-portrait : aspect-[3/4], --font-display-xl name, generous padding.
 *                     Position 0 on the grid (top-left). Reads as the cover.
 *   - hero-wide     : aspect-[5/3] landscape, --font-display-xl name. The
 *                     second hero, balancing brand-family on row 2.
 *   - medium        : aspect-[4/5] gentle portrait, --font-h3 name. Row 2 left.
 *   - small         : aspect-square, --font-body name. Stacked beside heroes.
 *
 * Brand-family label sits ABOVE the image (not below) with a hairline rule.
 * Gold rule for Lattafa, neutral rule for Aquad'or House.
 *
 * Motion model:
 *   - Per-card scroll-driven opacity / translateY / scale.
 *   - Hero cards get a stronger reveal (more y, slower curve).
 *   - Small cards get a quicker, subtler reveal so the eye lands on the heroes
 *     first.
 *   - Reduced-motion users skip both layers; layout still reads.
 *
 * Spec source: .planning/DESIGN.md §10b. Tokens only.
 */

import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { formatPrice } from '@/lib/currency';
import { Badge } from '@/components/ui/Badge';
import { isLattafaProduct } from '@/lib/supabase/product-service';
import type { Product } from '@/lib/supabase/types';

export type FeaturedEmphasis = 'hero-portrait' | 'hero-wide' | 'medium' | 'small';

export interface FeaturedCardProps {
  product: Product;
  index: number;
  /** Layout emphasis from the parent grid. Drives image aspect + typography. */
  emphasis: FeaturedEmphasis;
  /** Extra classes applied to the <motion.li> root (e.g. lg:col-span-8). */
  className?: string;
}

interface EmphasisStyle {
  aspect: string;
  nameClass: string;
  priceClass: string;
  brandClass: string;
  padTop: string;
  imageSizes: string;
}

const EMPHASIS_STYLES: Record<FeaturedEmphasis, EmphasisStyle> = {
  'hero-portrait': {
    aspect: 'aspect-[3/4]',
    nameClass:
      'font-display font-medium leading-[1.05] tracking-[-0.015em] text-[length:var(--font-display-xl)]',
    priceClass: 'font-display text-[length:var(--font-h3)]',
    brandClass: 'text-[11px]',
    padTop: 'pt-5 md:pt-6',
    imageSizes: '(min-width: 1024px) 66vw, 100vw',
  },
  'hero-wide': {
    aspect: 'aspect-[5/3]',
    nameClass:
      'font-display font-medium leading-[1.05] tracking-[-0.015em] text-[length:var(--font-display-xl)]',
    priceClass: 'font-display text-[length:var(--font-h3)]',
    brandClass: 'text-[11px]',
    padTop: 'pt-5 md:pt-6',
    imageSizes: '(min-width: 1024px) 66vw, 100vw',
  },
  medium: {
    aspect: 'aspect-[4/5]',
    nameClass:
      'font-display font-medium leading-[1.1] tracking-[-0.01em] text-[length:var(--font-h3)]',
    priceClass: 'font-display text-[1.125rem] md:text-[1.25rem]',
    brandClass: 'text-[10px]',
    padTop: 'pt-4',
    imageSizes: '(min-width: 1024px) 33vw, 50vw',
  },
  small: {
    aspect: 'aspect-square',
    nameClass:
      'font-display font-medium leading-[1.15] tracking-[-0.005em] text-[length:var(--font-size-body-lg)]',
    priceClass: 'font-body font-medium text-[1rem]',
    brandClass: 'text-[10px]',
    padTop: 'pt-4',
    imageSizes: '(min-width: 1024px) 33vw, 50vw',
  },
};

function BrandLabel({
  isLattafa,
  brandClass,
}: {
  isLattafa: boolean;
  brandClass: string;
}) {
  const labelText = isLattafa ? 'Lattafa Originals' : "Aquad’or House";
  const ruleClass = isLattafa ? 'bg-accent' : 'bg-border-strong';
  const textTone = isLattafa ? 'text-fg' : 'text-fg-muted';
  return (
    <div className="mb-4 inline-flex flex-col items-start">
      <span
        className={`font-micro ${brandClass} font-medium uppercase tracking-[0.18em] ${textTone}`}
      >
        {labelText}
      </span>
      <span
        aria-hidden="true"
        className={`mt-1.5 block h-px w-10 ${ruleClass}`}
      />
    </div>
  );
}

export default function FeaturedCard({
  product,
  index,
  emphasis,
  className = '',
}: FeaturedCardProps) {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLLIElement | null>(null);
  const secondary = product.images?.[0];
  const showCrossfade = !!secondary && secondary !== product.image;
  const isLattafa = isLattafaProduct(product);
  const styles = EMPHASIS_STYLES[emphasis];

  const isHero = emphasis === 'hero-portrait' || emphasis === 'hero-wide';
  const inStock = product.in_stock ?? true;
  const isOnSale = !!product.sale_price && inStock;
  const displayPrice = product.sale_price || product.price;

  // Scroll progress tied to THIS card's bounding box: 0 when its top first
  // enters the viewport bottom, 1 when its bottom passes the viewport top.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Hero cards: stronger reveal so they anchor the spread.
  // Small cards: lighter reveal so the heroes lead the eye.
  const opacityRange = isHero ? [0.3, 1, 1, 0.85] : [0.45, 1, 1, 0.9];
  const yRange = isHero ? [40, 0, 0, -12] : [20, 0, 0, -8];
  const scaleRange = isHero ? [0.96, 1, 1, 0.995] : [0.98, 1, 1, 1];

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.7, 1], opacityRange);
  const y = useTransform(scrollYProgress, [0, 0.2, 0.7, 1], yRange);
  const scale = useTransform(scrollYProgress, [0, 0.2, 0.7, 1], scaleRange);

  const motionStyle = reducedMotion ? undefined : { opacity, y, scale };

  return (
    <motion.li
      ref={ref}
      style={motionStyle}
      className={`group relative flex list-none flex-col ${className}`}
      data-emphasis={emphasis}
    >
      <BrandLabel isLattafa={isLattafa} brandClass={styles.brandClass} />

      <Link
        href={`/products/${product.id}`}
        aria-label={`View ${product.name}`}
        className="flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-bg"
      >
        <div
          className={`relative overflow-hidden bg-bg-alt ${styles.aspect} transition-transform duration-[var(--duration-base)] ease-[var(--ease-out-quart)] group-hover:-translate-y-1`}
        >
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes={styles.imageSizes}
            priority={isHero && index < 2}
            className="object-cover transition-transform duration-[600ms] ease-[var(--ease-out-quart)] group-hover:scale-[1.03]"
          />
          {showCrossfade && (
            <Image
              src={secondary}
              alt=""
              aria-hidden="true"
              fill
              sizes={styles.imageSizes}
              className="object-cover opacity-0 transition-opacity duration-[var(--duration-base)] ease-[var(--ease-out-quart)] group-hover:opacity-100"
            />
          )}

          {isOnSale && (
            <Badge variant="accent" className="absolute right-3 top-3">
              Sale
            </Badge>
          )}

          {!inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--scrim)]">
              <Badge variant="neutral">Out of stock</Badge>
            </div>
          )}
        </div>

        <div className={`flex flex-col gap-2 ${styles.padTop}`}>
          {product.brand ? (
            <p
              className={`font-micro ${styles.brandClass} font-medium uppercase tracking-[0.15em] text-fg-muted`}
            >
              {product.brand}
            </p>
          ) : null}

          <h3 className={`${styles.nameClass} text-fg line-clamp-2`}>
            {product.name}
          </h3>

          <div className="mt-1 flex items-baseline gap-2">
            <span className={`${styles.priceClass} font-medium text-fg`}>
              {formatPrice(displayPrice)}
            </span>
            {isOnSale && (
              <span className="font-body text-sm text-fg-muted line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          <span
            aria-hidden="true"
            className="mt-3 inline-flex items-center gap-2 font-micro text-[10px] font-medium uppercase tracking-[0.2em] text-fg"
          >
            <span className="relative inline-block">
              View
              <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-accent transition-transform duration-[var(--duration-base)] ease-[var(--ease-out-quart)] group-hover:scale-x-100" />
            </span>
          </span>
        </div>
      </Link>
    </motion.li>
  );
}
