/**
 * FeaturedGrid. Homepage editorial product grid (HOME-03).
 *
 * RSC-streamable as of M4 P1 T3 (POLISH-08): the section wrapper, header,
 * and grid container all render server-side. Each card is delegated to
 * `FeaturedCard` which carries the only client JS for this section
 * (FadeUp IntersectionObserver + HoverCrossfade group-hover swap).
 *
 * Spec: .planning/DESIGN.md §10b. Hairline-divider section, type-led layout,
 * NO Card wrapper at section level. ProductCard internal use is explicitly
 * allowed by the §10b verifier (interior tile, not section container).
 *
 * Layout: uniform editorial wall. 2 cols at sm, 3 at md, 4 at lg. Twelve
 * products visible, a richer mix of Aquad'or own + niche + Lattafa than
 * the prior six-tile spread. The cards are smaller so the eye reads the
 * catalogue as a curated wall, not a one-bottle magazine cover.
 *
 * Motion (M3 polish, matches Hero parallax at e1676ca):
 *   - Header rule + h2 cascade in via RevealHeader.
 *   - Each card reveals via FadeUp with a 60ms stagger (capped at 540ms so
 *     the last card lands well inside 1s).
 *   - Image hover crossfade flips between primary and secondary photo.
 *   - Card micro-shift: each <li> lifts 4px on group-hover.
 *
 * Named export `FeaturedGridSkeleton` mirrors the grid shape with `<Skeleton>`
 * blocks so the Suspense fallback ships zero cumulative layout shift.
 */

import { Skeleton } from '@/components/ui/Skeleton';
import type { Product } from '@/lib/supabase/types';
import FeaturedCard from './FeaturedCard';
import RevealHeader from './RevealHeader';

export interface FeaturedGridProps {
  products: Product[];
}

/** Number of cards rendered on the homepage. Tuned to the curated mix in
    src/lib/supabase/product-service.ts → getFeaturedProducts. */
const FEATURED_COUNT = 12;

export default function FeaturedGrid({ products }: FeaturedGridProps) {
  const items = products.slice(0, FEATURED_COUNT);

  return (
    <section className="border-t border-border py-16 md:py-24 px-[var(--page-px)]">
      <RevealHeader
        className="mb-12 max-w-[var(--container-narrow)]"
        title="What the desk is wearing now."
      />

      <ul className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
        {items.map((product, index) => (
          <FeaturedCard key={product.id} product={product} index={index} />
        ))}
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
