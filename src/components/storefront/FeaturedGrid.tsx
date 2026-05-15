/**
 * FeaturedGrid. Magazine-spread editorial product grid (HOME-03).
 *
 * Spec: .planning/DESIGN.md §10b. Hairline-divider section, numbered eyebrow,
 * type-led layout, NO Card wrapper at section level. ProductCard internal use
 * is explicitly allowed by the §10b verifier (interior tile, not section
 * container).
 *
 * Layout: 12-column grid at md+, single column on mobile. The lead product
 * spans col-span-7 row-span-2 to dominate visually; remaining items balance
 * around it in a typographic spread (col-span-5, col-span-4) so the eye is
 * pulled left-to-right like a magazine page rather than a uniform retail
 * grid.
 *
 * Motion: hover crossfade between primary and secondary image. ProductCard
 * does not natively accept a `secondaryImage` prop, so a co-located
 * `HoverCrossfade` overlay wraps each card and toggles opacity of an
 * absolutely-positioned second `<Image>` on group hover.
 *
 * Named export `FeaturedGridSkeleton` mirrors the grid shape with `<Skeleton>`
 * blocks so the Suspense fallback ships zero cumulative layout shift.
 */

import Image from 'next/image';
import { ProductCard } from '@/components/ui/ProductCard';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Product } from '@/lib/supabase/types';

export interface FeaturedGridProps {
  products: Product[];
}

// Magazine-spread spans: lead dominates, supporting items balance.
// Items 2 and 3 occupy the right column alongside the lead.
// Items 4-6 form a triplet beneath, each col-span-4.
const SPAN_CLASSES = [
  'md:col-span-7 md:row-span-2', // lead
  'md:col-span-5', // 2nd
  'md:col-span-5', // 3rd
  'md:col-span-4', // 4th
  'md:col-span-4', // 5th
  'md:col-span-4', // 6th
];

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
  // hover. ProductCard's outer `<Link>` carries the `group` class.
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-[var(--duration-base)] ease-[var(--ease-out-quart)] group-hover:opacity-100"
    >
      <Image
        src={secondary}
        alt={alt}
        fill
        sizes="(min-width: 768px) 50vw, 100vw"
        className="object-cover"
      />
      <span className="sr-only">{primary}</span>
    </div>
  );
}

export default function FeaturedGrid({ products }: FeaturedGridProps) {
  const items = products.slice(0, 6);

  return (
    <section className="border-t border-border py-16 md:py-24 px-[var(--page-px)]">
      <div className="mb-12 max-w-[var(--container-narrow)]">
        <p className="font-micro uppercase tracking-[0.08em] text-[length:var(--font-size-micro)] text-fg-muted">
          04 / Featured
        </p>
        <h2 className="mt-6 font-display text-fg leading-[1.1] tracking-[-0.01em] text-[length:var(--font-h1)]">
          Six the desk is wearing this week.
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {items.map((product, index) => {
          const secondary = product.images?.[0];
          const isLead = index === 0;
          return (
            <div
              key={product.id}
              className={`relative ${SPAN_CLASSES[index] ?? 'md:col-span-4'}`}
            >
              <div className="relative">
                <ProductCard product={product} priority={isLead} />
                {secondary && secondary !== product.image && (
                  <HoverCrossfade
                    primary={product.image}
                    secondary={secondary}
                    alt={product.name}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function FeaturedGridSkeleton() {
  return (
    <section className="border-t border-border py-16 md:py-24 px-[var(--page-px)]">
      <div className="mb-12 max-w-[var(--container-narrow)]">
        <p className="font-micro uppercase tracking-[0.08em] text-[length:var(--font-size-micro)] text-fg-muted">
          04 / Featured
        </p>
        <h2 className="mt-6 font-display text-fg leading-[1.1] tracking-[-0.01em] text-[length:var(--font-h1)]">
          Six the desk is wearing this week.
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {SPAN_CLASSES.map((span, index) => (
          <div key={index} className={span}>
            <Skeleton
              variant="rect"
              className="w-full aspect-[4/5]"
            />
            <Skeleton variant="text" className="mt-4 w-1/3" />
            <Skeleton variant="text" className="mt-2 w-2/3" />
          </div>
        ))}
      </div>
    </section>
  );
}
