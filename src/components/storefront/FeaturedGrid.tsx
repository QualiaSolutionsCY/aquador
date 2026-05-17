/**
 * FeaturedGrid. Homepage editorial product spread (HOME-03; re-redesigned
 * M4 P-polish for a TRUE magazine layout with six cards and real big/small
 * drama instead of twelve uniform tiles).
 *
 * RSC-streamable: the section wrapper, header, and grid container render
 * server-side. Each card is delegated to the client `FeaturedCard` leaf
 * which owns scroll motion, hover crossfade, and per-emphasis typography.
 *
 * Layout philosophy:
 *   The previous pass shipped twelve cards in a col-span pattern. Verdict
 *   from the desk was "boring cards". Col-span variation alone does not
 *   produce big/small drama because every card shares the same internal
 *   chassis (same aspect, same type scale). Editorial magazine spreads
 *   work because the BIG things are visibly bigger than the small things
 *   in image area, type scale, and breathing room.
 *
 *   So this pass commits to six cards across three rows, with three
 *   distinct emphases (hero / medium / small) that each own their own
 *   aspect ratio and typography internally inside FeaturedCard.
 *
 * Layout at lg+ (12-column grid, three rows):
 *
 *   Row 1:
 *     [    HERO PORTRAIT      ][ SMALL ][ SMALL ]
 *     [   col-span-8, 3/4     ][ col-span-4 stacked column ]
 *     position 0 (Aquad'or)     positions 1, 2
 *
 *   Row 2:
 *     [ MEDIUM ][        HERO WIDE         ]
 *     [ col-4  ][      col-span-8, 5/3     ]
 *     position 3 position 4 (Lattafa)
 *
 *   Row 3:
 *     [    SMALL    ]
 *     [  col-span-6 ]
 *     position 5
 *
 * Mobile / md: single-column on phones, 2-col on md, with no aspect tricks.
 * The magazine drama only fires at lg+ where there is room to read it.
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

/** Six cards. Three rows. Real big/small drama. */
const FEATURED_COUNT = 6;

interface SlotConfig {
  emphasis: FeaturedEmphasis;
  /** Grid column span at lg+. md+ uses an auto stack. */
  className: string;
}

/**
 * Slot table. Index = card position in the curated feed from
 * getFeaturedProducts. The product-service interleave already places
 * Aquad'or-house at 0 and a Lattafa card around position 2/5; we surface
 * Aquad'or as the portrait hero (0) and Lattafa as the wide hero (4) so
 * brand-family balance is read in the spread at a glance.
 *
 * Row 1: 8 / 4-stack-of-2 => totals 12 (the 4-col is a vertical container
 *        for the two small cards that follow it).
 * Row 2: 4 / 8 => totals 12.
 * Row 3: 6 alone (left-anchored).
 */
const SLOTS: ReadonlyArray<SlotConfig> = [
  // Row 1
  {
    emphasis: 'hero-portrait',
    // Takes 8 cols, spans both rows of the right-hand stack so heights match.
    className: 'md:col-span-2 lg:col-span-8 lg:row-span-2',
  },
  {
    emphasis: 'small',
    className: 'md:col-span-1 lg:col-span-4',
  },
  {
    emphasis: 'small',
    className: 'md:col-span-1 lg:col-span-4',
  },
  // Row 2
  {
    emphasis: 'medium',
    className: 'md:col-span-1 lg:col-span-4',
  },
  {
    emphasis: 'hero-wide',
    className: 'md:col-span-2 lg:col-span-8',
  },
  // Row 3
  {
    emphasis: 'small',
    className: 'md:col-span-2 lg:col-span-6',
  },
];

export default function FeaturedGrid({ products }: FeaturedGridProps) {
  const items = products.slice(0, FEATURED_COUNT);

  return (
    <section className="border-t border-border py-20 md:py-28 px-[var(--page-px)]">
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
    'aspect-[3/4]', // hero portrait
    'aspect-square', // small
    'aspect-square', // small
    'aspect-[4/5]', // medium
    'aspect-[5/3]', // hero wide
    'aspect-square', // small
  ];

  return (
    <section className="border-t border-border py-20 md:py-28 px-[var(--page-px)]">
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
