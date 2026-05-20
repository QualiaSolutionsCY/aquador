/**
 * FeaturedGrid. Homepage editorial product spread.
 *
 * The previous pass shipped six cards with hero/medium/small emphases to
 * create "big/small drama". The desk pushed back: the size variation read
 * as random rather than editorial, with the hero portrait competing
 * against the wide hero for attention and the smalls feeling like
 * afterthoughts. This pass replaces the variable-emphasis spread with a
 * uniform numbered-editorial grid — six cards across two rows of three,
 * every card the same shape, each prefixed by an index number (01–06)
 * in the manner of a magazine contents page.
 *
 * Layout at lg+ (12-column grid, two rows):
 *   Row 1: [ 01 ][ 02 ][ 03 ]   each col-span-4
 *   Row 2: [ 04 ][ 05 ][ 06 ]   each col-span-4
 *
 * md: 2-column stack. Mobile: single column.
 *
 * Section header: left-aligned heading + right-aligned "View all" link share
 * a baseline, with a hairline rule below the row. The headline uses
 * --font-display-2xl and includes one italicised word ("wearing") for the
 * editorial accent.
 *
 * Spec source: .planning/DESIGN.md §10b. No Card wrapper at section level.
 * No raw hex, tokens only. No em-dashes in copy.
 */

import Link from 'next/link';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Product } from '@/lib/supabase/types';
import FeaturedCard, { type FeaturedEmphasis } from './FeaturedCard';

export interface FeaturedGridProps {
  products: Product[];
}

/** Six cards. Two rows of three. Uniform editorial grid. */
const FEATURED_COUNT = 6;

interface SlotConfig {
  emphasis: FeaturedEmphasis;
  /** Grid column span at lg+. md+ uses a 2-col stack. */
  className: string;
}

/**
 * Slot table. All six positions share the medium emphasis and a 4-column
 * span at lg+ for a uniform 3-across grid. Index numbers (01–06) render
 * inside FeaturedCard via the `index` prop.
 */
const SLOTS: ReadonlyArray<SlotConfig> = [
  { emphasis: 'medium', className: 'md:col-span-1 lg:col-span-4' },
  { emphasis: 'medium', className: 'md:col-span-1 lg:col-span-4' },
  { emphasis: 'medium', className: 'md:col-span-1 lg:col-span-4' },
  { emphasis: 'medium', className: 'md:col-span-1 lg:col-span-4' },
  { emphasis: 'medium', className: 'md:col-span-1 lg:col-span-4' },
  { emphasis: 'medium', className: 'md:col-span-1 lg:col-span-4' },
];

export default function FeaturedGrid({ products }: FeaturedGridProps) {
  const items = products.slice(0, FEATURED_COUNT);

  return (
    <section className="border-t border-border-dark py-20 md:py-28 px-[var(--page-px)]">
      {/* Editorial header row: heading left, View all right, hairline below. */}
      <div className="mb-14 md:mb-20">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-12">
          <h2 className="max-w-[28ch] font-display text-fg leading-[1.05] tracking-[-0.015em] text-[length:var(--font-display-2xl)]">
            What the desk is{' '}
            <span className="italic text-fg">wearing</span> now.
          </h2>
          <Link
            href="/shop"
            className="group inline-flex shrink-0 items-center gap-3 self-start font-micro text-[11px] font-medium uppercase tracking-[0.22em] text-fg transition-colors duration-[var(--duration-base)] ease-[var(--ease-out-quart)] hover:text-accent-deep md:self-auto"
          >
            <span className="relative">
              View the full house
              <span
                aria-hidden="true"
                className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-100 bg-border-strong transition-colors duration-[var(--duration-base)] ease-[var(--ease-out-quart)] group-hover:bg-accent"
              />
            </span>
          </Link>
        </div>
        <span
          aria-hidden="true"
          className="mt-10 block h-px w-full bg-border"
        />
      </div>

      <ul className="grid grid-cols-1 gap-x-6 gap-y-14 md:grid-cols-2 md:gap-x-8 md:gap-y-16 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-20">
        {items.map((product, index) => {
          const slot = SLOTS[index];
          if (!slot) return null;
          return (
            <FeaturedCard
              key={product.id}
              product={product}
              index={index}
              emphasis={slot.emphasis}
              className={slot.className}
            />
          );
        })}
      </ul>
    </section>
  );
}

export function FeaturedGridSkeleton() {
  // Skeleton mirrors the live spread shape so Suspense fallback ships zero CLS.
  const skeletonAspects: ReadonlyArray<string> = [
    'aspect-[4/5]',
    'aspect-[4/5]',
    'aspect-[4/5]',
    'aspect-[4/5]',
    'aspect-[4/5]',
    'aspect-[4/5]',
  ];

  return (
    <section className="border-t border-border-dark py-20 md:py-28 px-[var(--page-px)]">
      <div className="mb-14 md:mb-20">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-12">
          <h2 className="max-w-[28ch] font-display text-fg leading-[1.05] tracking-[-0.015em] text-[length:var(--font-display-2xl)]">
            What the desk is{' '}
            <span className="italic text-fg">wearing</span> now.
          </h2>
          <span className="font-micro text-[11px] font-medium uppercase tracking-[0.22em] text-fg-muted">
            View the full house
          </span>
        </div>
        <span aria-hidden="true" className="mt-10 block h-px w-full bg-border" />
      </div>

      <ul className="grid grid-cols-1 gap-x-6 gap-y-14 md:grid-cols-2 md:gap-x-8 md:gap-y-16 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-20">
        {SLOTS.map((slot, index) => (
          <li
            key={index}
            className={`list-none ${slot.className}`}
            data-emphasis={slot.emphasis}
          >
            <Skeleton variant="text" className="mb-4 w-24" />
            <Skeleton variant="rect" className={`w-full ${skeletonAspects[index]}`} />
            <Skeleton variant="text" className="mt-5 w-1/3" />
            <Skeleton variant="text" className="mt-2 w-2/3" />
            <Skeleton variant="text" className="mt-2 w-1/4" />
          </li>
        ))}
      </ul>
    </section>
  );
}
