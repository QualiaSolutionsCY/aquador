'use client';

/**
 * ProductGrid. Editorial two-column shop layout with mobile drawer.
 *
 * Owns the URL contract for the shop route family. Reads `ShopFilters`
 * from `useSearchParams`, applies `applyShopFilters` + `applyShopSort`
 * to the input product list, and writes filter updates back to the URL
 * via `router.replace(..., { scroll: false })` inside a `useTransition`
 * so the grid stays interactive while the navigation flushes.
 *
 * Layout (DESIGN.md §10b hairline-stack pattern, no Card containers):
 *
 *   Desktop (≥ lg):
 *     ┌────────────┬──────────────────────────────┐
 *     │ Sidebar    │ Toolbar  N results   Sort ▾ │
 *     │ Refine     │ Chips · Clear all            │
 *     │ Search     ├──────────────────────────────┤
 *     │ Stock      │                              │
 *     │ Category   │  [card] [card] [card] [card] │
 *     │ Brand      │                              │
 *     │ Gender     │  [card] [card] [card] [card] │
 *     │ Price      │                              │
 *     │ Clear all  │                              │
 *     └────────────┴──────────────────────────────┘
 *
 *   Mobile (< lg):
 *     ┌──────────────────────────────────────────┐
 *     │ [Filters · 3]    N results    Sort ▾    │   (sticky toolbar)
 *     │ chip chip chip chip ▸                    │
 *     ├──────────────────────────────────────────┤
 *     │ [card]  [card]                           │
 *     │ [card]  [card]                           │
 *     └──────────────────────────────────────────┘
 *     Drawer (slide-from-right) wraps FilterPanel variant="drawer".
 *
 * Active filter chips live in this toolbar (not in the FilterPanel) so
 * they remain visible regardless of drawer / sidebar state.
 *
 * Voice: "Refine", "Sort by", "results", "Clear all", "Filters",
 * "Nothing matches yet.", "Loosen a filter, or try a different price band.".
 * No em-dashes, no emoji.
 */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import { ProductCard } from '@/components/ui/ProductCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tag } from '@/components/ui/Tag';
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerTitle,
} from '@/components/ui/Drawer';
import FilterPanel, {
  type BrandOption,
  type CategoryOption,
} from './FilterPanel';
import SortControl from './SortControl';
import {
  applyShopFilters,
  applyShopSort,
  parseShopFilters,
  stringifyShopFilters,
  type ShopFilters,
} from '@/lib/shop/filter-schema';
import { GENDER_OPTIONS, PRICE_BANDS } from '@/lib/constants';
import type { Product } from '@/lib/supabase/types';

export interface ProductGridProps {
  products: Product[];
  brandOptions: BrandOption[];
  categoryOptions: CategoryOption[];
  categorySlug?: string;
}

const SKELETON_COUNT = 8;
const FADE_UP_LIMIT = 8;

type ActiveChip = {
  key: string;
  label: string;
  remove: () => void;
};

export default function ProductGrid({
  products,
  brandOptions,
  categoryOptions,
  categorySlug,
}: ProductGridProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  // Active chip resolution (label maps + removal callbacks). Mirrors the
  // FilterPanel's per-filter semantics, but rendered above the grid.
  const brandLabel = useMemo(() => {
    const m = new Map<string, string>();
    for (const b of brandOptions) m.set(b.id, b.label);
    return m;
  }, [brandOptions]);

  const categoryLabel = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of categoryOptions) m.set(c.id, c.label);
    return m;
  }, [categoryOptions]);

  const showCategorySection =
    !categorySlug && categoryOptions.length > 0;

  const chips: ActiveChip[] = useMemo(() => {
    const out: ActiveChip[] = [];

    if (filters.search && filters.search.length > 0) {
      out.push({
        key: 'search',
        label: `“${filters.search}”`,
        remove: () => setFilters({ ...filters, search: undefined }),
      });
    }

    if (filters.inStock) {
      out.push({
        key: 'in-stock',
        label: 'In stock only',
        remove: () => setFilters({ ...filters, inStock: undefined }),
      });
    }

    if (showCategorySection && filters.category) {
      const label = categoryLabel.get(filters.category) ?? filters.category;
      out.push({
        key: `category-${filters.category}`,
        label,
        remove: () => setFilters({ ...filters, category: undefined }),
      });
    }

    filters.brand.forEach((id) => {
      const label = brandLabel.get(id);
      if (!label) return;
      out.push({
        key: `brand-${id}`,
        label,
        remove: () =>
          setFilters({ ...filters, brand: filters.brand.filter((v) => v !== id) }),
      });
    });

    if (filters.gender) {
      const option = GENDER_OPTIONS.find((o) => o.id === filters.gender);
      if (option) {
        out.push({
          key: `gender-${option.id}`,
          label: option.label,
          remove: () => setFilters({ ...filters, gender: undefined }),
        });
      }
    }

    filters.price.forEach((id) => {
      const option = PRICE_BANDS.find((o) => o.id === id);
      if (!option) return;
      out.push({
        key: `price-${id}`,
        label: option.label,
        remove: () =>
          setFilters({ ...filters, price: filters.price.filter((v) => v !== id) }),
      });
    });

    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, brandLabel, categoryLabel, showCategorySection]);

  const activeCount = chips.length;

  const clearAll = () => {
    setFilters({
      category: categorySlug ? filters.category : undefined,
      sort: filters.sort,
      brand: [],
      price: [],
      gender: undefined,
      inStock: undefined,
      search: undefined,
    });
  };

  // One-shot fade-up on the first row of cards (preserved from prior build).
  const gridRef = useRef<HTMLUListElement | null>(null);
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    if (typeof window === 'undefined') return;
    if (
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
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

  // Shared sidebar / drawer body. The mobile drawer simply re-mounts the
  // same FilterPanel in `variant="drawer"` so all controls stay identical
  // across surfaces.
  const filterPanel = (variant: 'sidebar' | 'drawer') => (
    <FilterPanel
      filters={filters}
      onChange={setFilters}
      brandOptions={brandOptions}
      categoryOptions={categoryOptions}
      hideCategoryFilter={Boolean(categorySlug)}
      variant={variant}
      resultCount={visible.length}
      onApply={() => setDrawerOpen(false)}
    />
  );

  return (
    <section className="border-t border-border-dark">
      <div className="px-[var(--page-px)] py-8 md:py-10 lg:py-12">
        <div className="grid grid-cols-1 gap-x-10 gap-y-6 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
          {/* Desktop sticky sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-32 max-h-[calc(100vh-9rem)] overflow-y-auto pr-1">
              {filterPanel('sidebar')}
            </div>
          </aside>

          {/* Main column — toolbar + chips + grid */}
          <div className="min-w-0">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-border pb-5">
              {/* Mobile filter trigger */}
              <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                <DrawerTrigger asChild>
                  <button
                    type="button"
                    className="lg:hidden inline-flex min-h-[44px] items-center gap-2 border border-border-strong px-4 py-2 font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg transition-colors duration-[var(--duration-fast)] hover:border-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                  >
                    <SlidersHorizontal
                      aria-hidden="true"
                      strokeWidth={1.5}
                      className="h-4 w-4"
                    />
                    <span>Filters</span>
                    {activeCount > 0 ? (
                      <span
                        aria-label={`${activeCount} filters active`}
                        className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-[5px] font-micro text-[10px] font-medium text-bg tabular-nums leading-none"
                      >
                        {activeCount}
                      </span>
                    ) : null}
                  </button>
                </DrawerTrigger>
                <DrawerContent
                  hideCloseButton
                  className="lg:hidden max-w-[22rem] sm:max-w-[26rem] p-0"
                >
                  <div className="flex h-full flex-col">
                    <div className="flex items-center justify-between border-b border-border px-6 py-5">
                      <DrawerTitle className="font-micro uppercase tracking-[0.08em] text-[length:var(--font-size-micro)] text-fg font-normal">
                        Filters
                      </DrawerTitle>
                      <button
                        type="button"
                        aria-label="Close filters"
                        onClick={() => setDrawerOpen(false)}
                        className="inline-flex h-11 w-11 items-center justify-center text-fg-muted transition-colors duration-[var(--duration-fast)] hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                      >
                        <X aria-hidden="true" strokeWidth={1.5} className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-hidden px-6 py-4">
                      {filterPanel('drawer')}
                    </div>
                  </div>
                </DrawerContent>
              </Drawer>

              {/* Result count */}
              <p className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted tabular-nums">
                {showSkeletons
                  ? 'Loading'
                  : `${visible.length} ${visible.length === 1 ? 'result' : 'results'}`}
              </p>

              {/* Sort */}
              <div className="ml-auto">
                <SortControl
                  value={filters.sort ?? 'featured'}
                  onChange={(sort) => setFilters({ ...filters, sort })}
                />
              </div>
            </div>

            {/* Active filter chips row */}
            {chips.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2 border-b border-border py-4">
                {chips.map((chip) => (
                  <Tag
                    key={chip.key}
                    label={chip.label}
                    variant="neutral"
                    onRemove={chip.remove}
                  />
                ))}
                <button
                  type="button"
                  onClick={clearAll}
                  className="ml-2 font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-accent-deep underline-offset-4 transition-colors duration-[var(--duration-fast)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg min-h-[36px]"
                >
                  Clear all
                </button>
              </div>
            ) : null}

            {/* Grid */}
            <div className="pt-8 md:pt-10">
              {showEmpty ? (
                <div className="py-16 text-center">
                  <p className="font-display text-fg leading-[1.1] text-[length:var(--font-h1)]">
                    Nothing matches yet.
                  </p>
                  <p className="mt-3 text-fg-muted text-[length:var(--font-size-body)]">
                    Loosen a filter, or try a different price band.
                  </p>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="mt-6 inline-flex min-h-[44px] items-center font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-accent-deep underline-offset-4 transition-colors duration-[var(--duration-fast)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                  >
                    Clear all
                  </button>
                </div>
              ) : (
                <ul
                  ref={gridRef}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-12"
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
                    : visible.map((product, i) => {
                        const shouldFadeUp = i < FADE_UP_LIMIT;
                        return (
                          <li
                            key={product.id}
                            {...(shouldFadeUp ? { 'data-fade-up': true } : {})}
                            className={
                              shouldFadeUp
                                ? 'opacity-0 translate-y-4 transition-[opacity,transform] duration-[var(--duration-base)] ease-[var(--ease-out-quart)] data-[visible=true]:opacity-100 data-[visible=true]:translate-y-0'
                                : ''
                            }
                          >
                            <ProductCard product={product} priority={i < 4} />
                          </li>
                        );
                      })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
