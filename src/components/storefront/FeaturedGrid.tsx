/**
 * FeaturedGrid. Homepage editorial product grid (HOME-03; redesigned M4 P2
 * for an asymmetric magazine-spread layout + visible brand-family alternation).
 *
 * RSC-streamable: the section wrapper, header, and grid container all render
 * server-side. Each card is delegated to the client `FeaturedCard` leaf which
 * owns the per-card scroll motion + brand-family label + hover crossfade.
 *
 * Spec source: .planning/DESIGN.md §10b. No Card wrapper at section level.
 * ProductCard internal use is explicitly allowed by §10b (interior tile).
 *
 * Layout:
 *   - sm / md: clean 2-col uniform grid. Mobile reads top-to-bottom; trying
 *     to do magazine-asymmetric on a phone produces noise, not narrative.
 *   - lg+: a 12-column editorial layout in four rows. The col-span pattern
 *     was tuned so that the round-robin brand order (house, house, Lattafa,
 *     house, house, Lattafa, ...) lands the Lattafa cards on emphasised
 *     positions, giving the alternation visual weight.
 *
 *     Pattern (12 cards across 4 rows):
 *       row 1:  [6 hero] [3] [3]                . card 0 hero (house)
 *       row 2:  [4]      [4] [4]                . card 3 standard (house)
 *       row 3:  [6 wide] [6 wide]               . cards 6 + 7
 *       row 4:  [3] [3] [6 hero]                . card 11 hero (Lattafa)
 *
 * Motion:
 *   - Header rule + h2 cascade in via RevealHeader (now with a slow Y parallax
 *     on the title at lg+ for an expensive-feeling drift).
 *   - Each card reveals via scroll-driven opacity / y / scale (see FeaturedCard).
 *   - Image hover crossfade flips between primary and secondary photo.
 *   - Reduced-motion users skip both layers; the layout still reads.
 *
 * Named export `FeaturedGridSkeleton` mirrors the grid shape with `<Skeleton>`
 * blocks so the Suspense fallback ships zero cumulative layout shift.
 */

import { Skeleton } from '@/components/ui/Skeleton';
import type { Product } from '@/lib/supabase/types';
import FeaturedCard, { type FeaturedEmphasis } from './FeaturedCard';
import RevealHeader from './RevealHeader';

export interface FeaturedGridProps {
  products: Product[];
}

/** Number of cards rendered on the homepage. Tuned to the curated mix in
    src/lib/supabase/product-service.ts → getFeaturedProducts. */
const FEATURED_COUNT = 12;

/**
 * Asymmetric col-span pattern at lg+. Indexed by card position (0..11).
 * Sum per row = 12 so the grid stays tight. The pattern keeps the same
 * total bottom edge per row so mobile-to-desktop transition is clean.
 */
const LG_COL_SPANS: ReadonlyArray<string> = [
  'lg:col-span-6', // 0 hero
  'lg:col-span-3', // 1
  'lg:col-span-3', // 2 (Lattafa)
  'lg:col-span-4', // 3
  'lg:col-span-4', // 4
  'lg:col-span-4', // 5 (Lattafa)
  'lg:col-span-6', // 6 wide
  'lg:col-span-6', // 7 wide
  'lg:col-span-3', // 8 (Lattafa)
  'lg:col-span-3', // 9
  'lg:col-span-6', // 10 hero
  'lg:col-span-12', // 11 (Lattafa) closing full-bleed editorial slab
];

const EMPHASIS_BY_INDEX: ReadonlyArray<FeaturedEmphasis> = [
  'hero', 'standard', 'standard',
  'standard', 'standard', 'standard',
  'wide', 'wide',
  'standard', 'standard',
  'hero', 'hero',
];

export default function FeaturedGrid({ products }: FeaturedGridProps) {
  const items = products.slice(0, FEATURED_COUNT);

  return (
    <section className="border-t border-border py-16 md:py-24 px-[var(--page-px)]">
      <RevealHeader
        className="mb-12 max-w-[var(--container-narrow)]"
        title="What the desk is wearing now."
        parallax
      />

      <ul className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-16">
        {items.map((product, index) => (
          <FeaturedCard
            key={product.id}
            product={product}
            index={index}
            emphasis={EMPHASIS_BY_INDEX[index] ?? 'standard'}
            className={LG_COL_SPANS[index] ?? 'lg:col-span-3'}
          />
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

      <ul className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 lg:grid-cols-12 lg:gap-x-8">
        {Array.from({ length: FEATURED_COUNT }).map((_, index) => (
          <li
            key={index}
            className={`list-none ${LG_COL_SPANS[index] ?? 'lg:col-span-3'}`}
          >
            <Skeleton variant="text" className="mb-3 w-24" />
            <Skeleton variant="rect" className="w-full aspect-[4/5]" />
            <Skeleton variant="text" className="mt-4 w-1/3" />
            <Skeleton variant="text" className="mt-2 w-2/3" />
          </li>
        ))}
      </ul>
    </section>
  );
}
