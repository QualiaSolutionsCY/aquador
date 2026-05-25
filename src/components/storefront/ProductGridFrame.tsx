'use client';

import { useMemo, useState, useTransition, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import { Tag } from '@/components/ui/Tag';
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/Drawer';
import FilterPanel, {
  type BrandOption,
  type CategoryOption,
} from './FilterPanel';
import SortControl from './SortControl';
import {
  stringifyShopFilters,
  type ShopFilters,
} from '@/lib/shop/filter-schema';
import { GENDER_OPTIONS, PRICE_BANDS } from '@/lib/constants';

type ActiveChip = {
  key: string;
  label: string;
  remove: () => void;
};

export interface ProductGridFrameProps {
  filters: ShopFilters;
  brandOptions: BrandOption[];
  categoryOptions: CategoryOption[];
  categorySlug?: string;
  resultCount: number;
  children: ReactNode;
}

export default function ProductGridFrame({
  filters,
  brandOptions,
  categoryOptions,
  categorySlug,
  resultCount,
  children,
}: ProductGridFrameProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const setFilters = (next: ShopFilters) => {
    const params = stringifyShopFilters(next);
    const query = params.toString();
    const href = query.length > 0 ? `${pathname}?${query}` : pathname;
    startTransition(() => {
      router.replace(href, { scroll: false });
    });
  };

  const brandLabel = useMemo(() => {
    const labels = new Map<string, string>();
    for (const brand of brandOptions) labels.set(brand.id, brand.label);
    return labels;
  }, [brandOptions]);

  const categoryLabel = useMemo(() => {
    const labels = new Map<string, string>();
    for (const category of categoryOptions) labels.set(category.id, category.label);
    return labels;
  }, [categoryOptions]);

  const showCategorySection = !categorySlug && categoryOptions.length > 0;

  const chips: ActiveChip[] = useMemo(() => {
    const out: ActiveChip[] = [];

    if (filters.search && filters.search.length > 0) {
      out.push({
        key: 'search',
        label: `"${filters.search}"`,
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
      out.push({
        key: `category-${filters.category}`,
        label: categoryLabel.get(filters.category) ?? filters.category,
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
          setFilters({ ...filters, brand: filters.brand.filter((value) => value !== id) }),
      });
    });

    if (filters.gender) {
      const option = GENDER_OPTIONS.find((candidate) => candidate.id === filters.gender);
      if (option) {
        out.push({
          key: `gender-${option.id}`,
          label: option.label,
          remove: () => setFilters({ ...filters, gender: undefined }),
        });
      }
    }

    filters.price.forEach((id) => {
      const option = PRICE_BANDS.find((candidate) => candidate.id === id);
      if (!option) return;
      out.push({
        key: `price-${id}`,
        label: option.label,
        remove: () =>
          setFilters({ ...filters, price: filters.price.filter((value) => value !== id) }),
      });
    });

    return out;
    // setFilters intentionally writes the current URL state and should not
    // make chip creation unstable.
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

  const filterPanel = (variant: 'sidebar' | 'drawer') => (
    <FilterPanel
      filters={filters}
      onChange={setFilters}
      brandOptions={brandOptions}
      categoryOptions={categoryOptions}
      hideCategoryFilter={Boolean(categorySlug)}
      variant={variant}
      resultCount={resultCount}
      onApply={() => setDrawerOpen(false)}
    />
  );

  return (
    <section className="border-t border-border-dark">
      <div className="px-[var(--page-px)] py-8 md:py-10 lg:py-12">
        <div className="grid grid-cols-1 gap-x-10 gap-y-6 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-32 max-h-[calc(100vh-9rem)] overflow-y-auto pr-1">
              {filterPanel('sidebar')}
            </div>
          </aside>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-border pb-5">
              <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                <DrawerTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex min-h-[44px] items-center gap-2 border border-border-strong px-4 py-2 font-micro text-[length:var(--font-size-micro)] uppercase tracking-[0.05em] text-fg transition-colors duration-[var(--duration-fast)] hover:border-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg lg:hidden"
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
                        className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-[5px] font-micro text-[10px] font-medium leading-none text-bg tabular-nums"
                      >
                        {activeCount}
                      </span>
                    ) : null}
                  </button>
                </DrawerTrigger>
                <DrawerContent
                  hideCloseButton
                  className="max-w-[22rem] p-0 sm:max-w-[26rem] lg:hidden"
                >
                  <div className="flex h-full flex-col">
                    <div className="flex items-center justify-between border-b border-border px-6 py-5">
                      <DrawerTitle className="font-micro text-[length:var(--font-size-micro)] font-normal uppercase tracking-[0.08em] text-fg">
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

              <p className="font-micro text-[length:var(--font-size-micro)] uppercase tracking-[0.05em] text-fg-muted tabular-nums">
                {isPending
                  ? 'Loading'
                  : `${resultCount} ${resultCount === 1 ? 'result' : 'results'}`}
              </p>

              <div className="ml-auto">
                <SortControl
                  value={filters.sort ?? 'featured'}
                  onChange={(sort) => setFilters({ ...filters, sort })}
                />
              </div>
            </div>

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
                  className="ml-2 min-h-[36px] font-micro text-[length:var(--font-size-micro)] uppercase tracking-[0.05em] text-accent-deep underline-offset-4 transition-colors duration-[var(--duration-fast)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                >
                  Clear all
                </button>
              </div>
            ) : null}

            <div className="pt-8 md:pt-10">
              {resultCount === 0 ? (
                <div className="py-16 text-center">
                  <p className="font-display text-[length:var(--font-h1)] leading-[1.1] text-fg">
                    Nothing matches yet.
                  </p>
                  <p className="mt-3 text-[length:var(--font-size-body)] text-fg-muted">
                    Loosen a filter, or try a different price band.
                  </p>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="mt-6 inline-flex min-h-[44px] items-center font-micro text-[length:var(--font-size-micro)] uppercase tracking-[0.05em] text-accent-deep underline-offset-4 transition-colors duration-[var(--duration-fast)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                  >
                    Clear all
                  </button>
                </div>
              ) : (
                children
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
