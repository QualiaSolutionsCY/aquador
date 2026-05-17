'use client';

/**
 * FeaturedCard. Per-card client leaf for FeaturedGrid (POLISH-08, M4 P1 T3;
 * refactored in M4 P2 for editorial-premium feel + brand-family alternation).
 *
 * Bundles per-card scroll-driven motion (useScroll + useTransform) plus a
 * brand-family hairline label that visually confirms the Aquad'or / Lattafa
 * alternation set up in product-service.getFeaturedProducts.
 *
 * Motion model (editorial, not gimmicky):
 *   - Per-card scroll progress drives opacity (0.35 to 1 to 0.7), translateY
 *     (28px to 0 to -16px), and scale (0.97 to 1 to 0.99). The card lifts in
 *     as it enters the viewport, sits at rest in the reading zone, then drifts
 *     slightly UP as it leaves the top, producing a Loewe / Fendi filmstrip
 *     feel without per-card 3D tricks.
 *   - HoverCrossfade on top of the ProductCard's primary image flips to a
 *     secondary photo on group hover.
 *
 * Brand-family label (above the ProductCard tile, hairline micro caps):
 *   - "AQUAD'OR HOUSE" for niche / essence-oil / women / men cards.
 *   - "LATTAFA ORIGINALS" for lattafa-original cards, with a thin accent rule
 *     beneath the label so the alternation is immediately legible.
 *
 * Spec source: .planning/DESIGN.md §10b. No Card wrapper, no raw hex, tokens
 * only for motion (--duration-base + --ease-out-quart) and color (--accent +
 * --fg-muted via Tailwind aliases).
 */

import Image from 'next/image';
import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { ProductCard } from '@/components/ui/ProductCard';
import { isLattafaProduct } from '@/lib/supabase/product-service';
import type { Product } from '@/lib/supabase/types';

export type FeaturedEmphasis = 'hero' | 'wide' | 'standard';

export interface FeaturedCardProps {
  product: Product;
  index: number;
  /** Layout emphasis from the parent grid. Drives image aspect on lg+. */
  emphasis?: FeaturedEmphasis;
  /** Extra classes applied to the <motion.li> root (e.g. lg:col-span-6). */
  className?: string;
}

function HoverCrossfade({
  primary,
  secondary,
  alt,
}: {
  primary: string;
  secondary: string;
  alt: string;
}) {
  // Absolute overlay that fades in over ProductCard's primary image on group
  // hover. The parent <li> carries the `group` class.
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-[var(--duration-base)] ease-[var(--ease-out-quart)] group-hover:opacity-100"
    >
      <Image
        src={secondary}
        alt={alt}
        fill
        sizes="(min-width: 1024px) 50vw, (min-width: 768px) 33vw, 50vw"
        className="object-cover"
      />
      <span className="sr-only">{primary}</span>
    </div>
  );
}

function BrandLabel({ isLattafa }: { isLattafa: boolean }) {
  if (isLattafa) {
    return (
      <div className="mb-3 inline-flex flex-col items-start">
        <span className="font-micro text-[0.625rem] font-medium uppercase tracking-[0.18em] text-fg">
          Lattafa Originals
        </span>
        <span
          aria-hidden="true"
          className="mt-1 block h-px w-8 bg-accent"
        />
      </div>
    );
  }
  return (
    <div className="mb-3 inline-flex flex-col items-start">
      <span className="font-micro text-[0.625rem] font-medium uppercase tracking-[0.18em] text-fg-muted">
        Aquad&rsquo;or House
      </span>
      <span
        aria-hidden="true"
        className="mt-1 block h-px w-8 bg-border-strong"
      />
    </div>
  );
}

export default function FeaturedCard({ product, index, emphasis = 'standard', className = '' }: FeaturedCardProps) {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLLIElement | null>(null);
  const secondary = product.images?.[0];
  const showCrossfade = !!secondary && secondary !== product.image;
  const isLattafa = isLattafaProduct(product);

  // Scroll progress tied to THIS card's bounding box: 0 when the card's top
  // first enters the viewport bottom, 1 when its bottom passes the viewport
  // top. Drives opacity / y / scale for the filmstrip motion.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Three-stop curves: rise in, rest, drift out.
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.7, 1], [0.35, 1, 1, 0.7]);
  const y = useTransform(scrollYProgress, [0, 0.2, 0.7, 1], [28, 0, 0, -16]);
  const scale = useTransform(scrollYProgress, [0, 0.2, 0.7, 1], [0.97, 1, 1, 0.99]);

  const motionStyle = reducedMotion ? undefined : { opacity, y, scale };

  return (
    <motion.li
      ref={ref}
      style={motionStyle}
      className={`group relative list-none transition-transform duration-[var(--duration-base)] ease-[var(--ease-out-quart)] hover:-translate-y-1 ${className}`}
      data-emphasis={emphasis}
    >
      <BrandLabel isLattafa={isLattafa} />
      <div className="relative">
        <ProductCard product={product} priority={index < 4} variant="compact" />
        {showCrossfade && (
          <HoverCrossfade
            primary={product.image}
            secondary={secondary}
            alt={product.name}
          />
        )}
      </div>
    </motion.li>
  );
}
