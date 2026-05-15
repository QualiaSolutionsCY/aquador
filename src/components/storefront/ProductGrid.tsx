'use client';

/**
 * ProductGrid. Numbered-editorial shop grid container (SHOP-01..04).
 *
 * Owns the URL contract for the shop route family. Reads `ShopFilters`
 * from `useSearchParams`, applies `applyShopFilters` + `applyShopSort`
 * to the input product list, and writes filter updates back to the URL
 * via `router.replace(..., { scroll: false })` inside a `useTransition`
 * so the grid stays interactive while the navigation flushes.
 *
 * Editorial spec (DESIGN.md §10b): NO Card wrapper at the section level.
 * Three numbered editorial bands ("01 / Refine", "02 / Order by",
 * "03 / Results") separated by hairline borders. The first row of cards
 * fades up on scroll-into-view via a one-shot IntersectionObserver.
 * Hover and skeleton-pulse motion are inherited from ProductCard and
 * Skeleton. All motion is zeroed under `prefers-reduced-motion` by
 * tokens.css.
 *
 * Voice: "Refine", "Order by", "Results", "Clear filters",
 * "Nothing matches yet.", "Loosen a filter, or try a different family.".
 * No em-dashes, no emoji.
 */

import {
  useEffect,
  useMemo,
  useRef,
  useTransition,
} from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ProductCard } from '@/components/ui/ProductCard';
import { Skeleton } from '@/components/ui/Skeleton';
import FilterPanel from './FilterPanel';
import SortControl from './SortControl';
import {
  applyShopFilters,
  applyShopSort,
  parseShopFilters,
  stringifyShopFilters,
  type ShopFilters,
} from '@/lib/shop/filter-schema';
import type { Product } from '@/lib/supabase/types';

export interface ProductGridProps {
  products: Product[];
  /** When set, hides the category-pivot UI in the filter panel. */
  categorySlug?: string;
}

const SKELETON_COUNT = 8;
const FADE_UP_LIMIT = 8;

export default function ProductGrid({
  products,
  categorySlug,
}: ProductGridProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const filters: ShopFilters = useMemo(
    () => parseShopFilters(searchParams),
    [searchParams],
  );

  const visible = useMemo(
    () =>
      applyShopSort(
        applyShopFilters(products, filters),
        filters.sort ?? 'featured',
      ),
    [products, filters],
  );

  const setFilters = (next: ShopFilters) => {
    const params = stringifyShopFilters(next);
    const query = params.toString();
    const href = query.length > 0 ? `${pathname}?${query}` : pathname;
    startTransition(() => {
      router.replace(href, { scroll: false });
    });
  };

  // One-shot fade-up on the first row of cards. Uses IntersectionObserver
  // and a data attribute so CSS owns the transition (no JS height math).
  const gridRef = useRef<HTMLUListElement | null>(null);
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    if (typeof window === 'undefined') return;
    if (
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      // Reduced motion: skip the effect, reveal immediately.
      grid
        .querySelectorAll<HTMLElement>('[data-fade-up]')
        .forEach((el) => el.setAttribute('data-visible', 'true'));
      return;
    }
    const items = Array.from(
      grid.querySelectorAll<HTMLElement>('[data-fade-up]'),
    ).slice(0, FADE_UP_LIMIT);
    if (items.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.1) {
            const el = entry.target as HTMLElement;
            el.setAttribute('data-visible', 'true');
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.1 },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [visible]);

  const showSkeletons = isPending;
  const showEmpty = !isPending && visible.length === 0;

  return (
    <section className="border-t border-border">
      {/* 01 / Refine */}
      <div className="border-b border-border py-10 md:py-12 px-[var(--page-px)]">
        <p className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted">
          01 / Refine
        </p>
        <div className="mt-6">
          <FilterPanel
            filters={filters}
            onChange={setFilters}
            hideCategoryFilter={Boolean(categorySlug)}
          />
        </div>
      </div>

      {/* 02 / Order by */}
      <div className="border-b border-border py-8 px-[var(--page-px)]">
        <p className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted">
          02 / Order by
        </p>
        <div className="mt-4">
          <SortControl
            value={filters.sort ?? 'featured'}
            onChange={(sort) => setFilters({ ...filters, sort })}
          />
        </div>
      </div>

      {/* 03 / Results */}
      <div className="py-10 md:py-12 px-[var(--page-px)]">
        <p className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted">
          03 / Results
          <span className="ml-2 text-fg">{showSkeletons ? '' : visible.length}</span>
        </p>

        {showEmpty ? (
          <div className="border-t border-border mt-8 py-16 text-center">
            <p className="font-display text-fg leading-[1.1] text-[length:var(--font-h1)]">
              Nothing matches yet.
            </p>
            <p className="mt-3 text-fg-muted text-[length:var(--font-size-body)]">
              Loosen a filter, or try a different family.
            </p>
            <button
              type="button"
              onClick={() =>
                setFilters({
                  category: filters.category,
                  sort: filters.sort,
                  brand: [],
                  family: [],
                  price: [],
                  gender: undefined,
                  search: undefined,
                })
              }
              className="mt-6 inline-flex min-h-[44px] items-center font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-accent-deep underline-offset-4 transition-colors duration-[var(--duration-fast)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <ul
            ref={gridRef}
            className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12"
          >
            {showSkeletons
              ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                  <li key={`skeleton-${i}`}>
                    <Skeleton
                      variant="rect"
                      className="w-full aspect-[3/4]"
                    />
                    <Skeleton variant="text" className="mt-4 w-1/3" />
                    <Skeleton variant="text" className="mt-2 w-2/3" />
                  </li>
                ))
              : visible.map((product, i) => (
                  <li
                    key={product.id}
                    data-fade-up
                    className="opacity-0 translate-y-4 transition-[opacity,transform] duration-[var(--duration-base)] ease-[var(--ease-out-quart)] data-[visible=true]:opacity-100 data-[visible=true]:translate-y-0"
                  >
                    <ProductCard product={product} priority={i < 4} />
                  </li>
                ))}
          </ul>
        )}
      </div>
    </section>
  );
}
