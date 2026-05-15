'use client';

/**
 * FeaturedGrid. Homepage editorial product grid (HOME-03).
 *
 * Spec: .planning/DESIGN.md §10b. Hairline-divider section, type-led layout,
 * NO Card wrapper at section level. ProductCard internal use is explicitly
 * allowed by the §10b verifier (interior tile, not section container).
 *
 * Layout (redesigned per owner direction): uniform editorial wall. 2 cols at
 * sm, 3 at md, 4 at lg. Twelve products visible — a richer mix of Aquad'or
 * own + niche + Lattafa than the prior six-tile spread. The cards are smaller
 * so the eye reads the catalogue as a curated wall, not a one-bottle magazine
 * cover. The lead-dominant magazine grid was good copy, bad commerce — the
 * owner wants the shopper to see range first.
 *
 * Motion (M3 polish, matches Hero parallax at e1676ca):
 *   - Header rule + h2 cascade in via RevealHeader.
 *   - Each card reveals via FadeUp with a 60ms stagger (capped at 540ms so
 *     the last card lands well inside 1s — keeps the page feeling alive
 *     without making the shopper wait for the bottom row).
 *   - Image hover crossfade (HoverCrossfade) flips between primary and
 *     secondary product photo on group hover.
 *   - Card micro-shift: each <li> lifts 4px on group-hover via translate-y.
 *
 * Named export `FeaturedGridSkeleton` mirrors the grid shape with `<Skeleton>`
 * blocks so the Suspense fallback ships zero cumulative layout shift.
 */

import Image from 'next/image';
import { ProductCard } from '@/components/ui/ProductCard';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Product } from '@/lib/supabase/types';
import FadeUp from './FadeUp';
import RevealHeader from './RevealHeader';

export interface FeaturedGridProps {
  products: Product[];
}

/** Number of cards rendered on the homepage. Tuned to the curated mix in
    src/lib/supabase/product-service.ts → getFeaturedProducts. */
const FEATURED_COUNT = 12;

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
  // hover. ProductCard's outer <Link> carries the `group` class.
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-[var(--duration-base)] ease-[var(--ease-out-quart)] group-hover:opacity-100"
    >
      <Image
        src={secondary}
        alt={alt}
        fill
        sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
        className="object-cover"
      />
      <span className="sr-only">{primary}</span>
    </div>
  );
}

export default function FeaturedGrid({ products }: FeaturedGridProps) {
  const items = products.slice(0, FEATURED_COUNT);

  return (
    <section className="border-t border-border py-16 md:py-24 px-[var(--page-px)]">
      <RevealHeader
        className="mb-12 max-w-[var(--container-narrow)]"
        title="What the desk is wearing now."
      />

      <ul className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
        {items.map((product, index) => {
          const secondary = product.images?.[0];
          return (
            <FadeUp key={product.id} delay={Math.min(index * 60, 540)}>
              <li className="group relative list-none transition-transform duration-[var(--duration-base)] ease-[var(--ease-out-quart)] hover:-translate-y-1">
                <div className="relative">
                  <ProductCard product={product} priority={index < 4} variant="compact" />
                  {secondary && secondary !== product.image && (
                    <HoverCrossfade
                      primary={product.image}
                      secondary={secondary}
                      alt={product.name}
                    />
                  )}
                </div>
              </li>
            </FadeUp>
          );
        })}
      </ul>
    </section>
  );
}

export function FeaturedGridSkeleton() {
  return (
    <section className="border-t border-border py-16 md:py-24 px-[var(--page-px)]">
      <div className="mb-12 max-w-[var(--container-narrow)]">
        <span aria-hidden="true" className="block h-px w-12 bg-border-strong" />
        <h2 className="mt-8 font-display text-fg leading-[1.1] tracking-[-0.01em] text-[length:var(--font-h1)]">
          What the desk is wearing now.
        </h2>
      </div>

      <ul className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
        {Array.from({ length: FEATURED_COUNT }).map((_, index) => (
          <li key={index} className="list-none">
            <Skeleton variant="rect" className="w-full aspect-[4/5]" />
            <Skeleton variant="text" className="mt-4 w-1/3" />
            <Skeleton variant="text" className="mt-2 w-2/3" />
          </li>
        ))}
      </ul>
    </section>
  );
}
