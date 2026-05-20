'use client';

/**
 * FilterPanel. Editorial sidebar-or-drawer filter container for the shop
 * storefront.
 *
 * Hairline-stack pattern: a vertical run of disclosure rows separated by
 * `--border` hairlines. Each row opens INLINE via a CSS grid-rows transition
 * (0fr to 1fr) with `--duration-base` and `--ease-out-quart`. No JS height
 * measurement, no popouts. Motion is zeroed under `prefers-reduced-motion`
 * by tokens.css.
 *
 * The panel is the same DOM in both surfaces:
 *   - desktop: rendered inline in a sticky 280px left rail
 *   - mobile:  rendered inside a slide-in drawer
 *
 * Active filter chips are NOT rendered here — they live in the results
 * toolbar above the grid so they remain visible regardless of whether the
 * panel is open. The panel owns its own "Refine · N active" header and a
 * single "Clear all" affordance.
 *
 * Sections (top to bottom):
 *   Search        keyword search across name / description / brand / tags
 *   In stock only single switch
 *   Category      multi-radio (hidden when hideCategoryFilter)
 *   Brand         multi-checkbox with inline search when > 8 entries
 *   Gender        single radio
 *   Price         multi-checkbox over fixed bands
 *
 * Controlled component: caller owns the `ShopFilters` value and writes
 * the URL.
 */

import { useMemo, useState, type ReactNode } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/Checkbox';
import { RadioGroup, RadioItem } from '@/components/ui/Radio';
import { Switch } from '@/components/ui/Switch';
import { GENDER_OPTIONS, PRICE_BANDS } from '@/lib/constants';
import type { ShopFilters } from '@/lib/shop/filter-schema';

export interface BrandOption {
  id: string;
  label: string;
  count: number;
}

export interface CategoryOption {
  id: string;
  label: string;
  count?: number;
}

export interface FilterPanelProps {
  filters: ShopFilters;
  onChange: (next: ShopFilters) => void;
  brandOptions: BrandOption[];
  categoryOptions: CategoryOption[];
  hideCategoryFilter?: boolean;
  /** Optional total result count for the "Show N results" footer (drawer mode). */
  resultCount?: number;
  /** Renders the panel for drawer mode (adds a sticky bottom CTA row). */
  variant?: 'sidebar' | 'drawer';
  /** Called when the drawer footer "Show results" button is tapped. */
  onApply?: () => void;
}

/** Threshold above which the Brand section gets an inline search input. */
const BRAND_INLINE_SEARCH_THRESHOLD = 8;

function toggleMulti(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

interface SectionProps {
  title: string;
  count: number;
  children: ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, count, children, defaultOpen = false }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const headerId = `filter-section-${slug}`;
  const panelId = `${headerId}-panel`;
  return (
    <div className="border-t border-border-dark">
      <button
        type="button"
        id={headerId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="group flex w-full items-center justify-between gap-3 py-4 text-left min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        <span className="flex items-baseline gap-2 font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg">
          <span>{title}</span>
          {count > 0 ? (
            <span
              aria-label={`${count} selected`}
              className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-[5px] font-micro text-[10px] font-medium text-bg tabular-nums leading-none"
            >
              {count}
            </span>
          ) : null}
        </span>
        <ChevronDown
          aria-hidden="true"
          strokeWidth={1.5}
          className={`h-4 w-4 text-fg-muted transition-transform duration-[var(--duration-base)] ease-[var(--ease-out-quart)] group-hover:text-fg ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={headerId}
        className="grid transition-[grid-template-rows] duration-[var(--duration-base)] ease-[var(--ease-out-quart)]"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="pb-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

function OptionRow({
  htmlFor,
  label,
  count,
  selected,
  children,
}: {
  htmlFor: string;
  label: string;
  count?: number;
  selected?: boolean;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={`group flex items-center gap-3 py-2 min-h-[40px] cursor-pointer text-fg transition-colors duration-[var(--duration-fast)] ${
        selected ? 'text-fg' : 'text-fg/85 hover:text-fg'
      }`}
    >
      {children}
      <span className="flex-1 text-[length:var(--font-size-body-sm)]">
        {label}
      </span>
      {typeof count === 'number' ? (
        <span className="font-micro text-[length:var(--font-size-micro)] text-fg-muted tabular-nums">
          {count}
        </span>
      ) : null}
    </label>
  );
}

export default function FilterPanel({
  filters,
  onChange,
  brandOptions,
  categoryOptions,
  hideCategoryFilter = false,
  resultCount,
  variant = 'sidebar',
  onApply,
}: FilterPanelProps) {
  const [brandQuery, setBrandQuery] = useState('');
  const [searchDraft, setSearchDraft] = useState(filters.search ?? '');

  const showCategorySection = !hideCategoryFilter && categoryOptions.length > 0;

  const activeCount =
    filters.brand.length +
    filters.price.length +
    (filters.gender ? 1 : 0) +
    (filters.inStock ? 1 : 0) +
    (filters.search && filters.search.length > 0 ? 1 : 0) +
    (showCategorySection && filters.category ? 1 : 0);

  const filteredBrands = useMemo(() => {
    const needle = brandQuery.trim().toLowerCase();
    if (!needle) return brandOptions;
    return brandOptions.filter(
      (b) =>
        b.label.toLowerCase().includes(needle) ||
        b.id.toLowerCase().includes(needle),
    );
  }, [brandOptions, brandQuery]);

  const clearAll = () => {
    onChange({
      category: hideCategoryFilter ? filters.category : undefined,
      sort: filters.sort,
      brand: [],
      price: [],
      gender: undefined,
      inStock: undefined,
      search: undefined,
    });
    setBrandQuery('');
    setSearchDraft('');
  };

  const commitSearch = (value: string) => {
    const trimmed = value.trim();
    onChange({
      ...filters,
      search: trimmed.length > 0 ? trimmed : undefined,
    });
  };

  const isDrawer = variant === 'drawer';
  const showBrandSearch = brandOptions.length > BRAND_INLINE_SEARCH_THRESHOLD;

  return (
    <div className={isDrawer ? 'flex h-full flex-col' : 'w-full'}>
      {/* Header — Refine label + Clear all link */}
      <div className="flex items-baseline justify-between gap-4 pb-3">
        <h2 className="font-micro uppercase tracking-[0.08em] text-[length:var(--font-size-micro)] text-fg">
          Refine
          {activeCount > 0 ? (
            <span className="ml-2 text-fg-muted normal-case tracking-[0.05em]">
              {activeCount} active
            </span>
          ) : null}
        </h2>
        {activeCount > 0 ? (
          <button
            type="button"
            onClick={clearAll}
            className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-accent-deep underline-offset-4 transition-colors duration-[var(--duration-fast)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg min-h-[36px]"
          >
            Clear all
          </button>
        ) : null}
      </div>

      <div className={isDrawer ? 'flex-1 overflow-y-auto' : ''}>
        {/* Keyword search — committed on Enter or blur */}
        <div className="border-t border-border-dark pt-4 pb-4">
          <label
            htmlFor="filter-search"
            className="block font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted pb-2"
          >
            Search
          </label>
          <div className="relative flex items-center">
            <Search
              aria-hidden="true"
              strokeWidth={1.5}
              className="pointer-events-none absolute left-3 h-4 w-4 text-fg-muted"
            />
            <input
              id="filter-search"
              type="search"
              inputMode="search"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onBlur={(e) => commitSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commitSearch(searchDraft);
                }
                if (e.key === 'Escape') {
                  setSearchDraft('');
                  commitSearch('');
                }
              }}
              placeholder="Oud, vanilla, leather"
              aria-label="Search the catalogue"
              className="w-full bg-bg border border-border-strong rounded-[6px] pl-10 pr-9 py-2.5 text-[length:var(--font-size-body-sm)] font-body text-fg placeholder:text-fg-muted/70 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-bg transition-shadow duration-[var(--duration-fast)]"
            />
            {searchDraft.length > 0 ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setSearchDraft('');
                  commitSearch('');
                }}
                className="absolute right-1 inline-flex h-9 w-9 items-center justify-center rounded-sm text-fg-muted transition-colors duration-[var(--duration-fast)] hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <X aria-hidden="true" strokeWidth={1.5} className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        </div>

        {/* In-stock toggle */}
        <div className="flex items-center justify-between gap-4 border-t border-border-dark py-4 min-h-[44px]">
          <label
            htmlFor="filter-in-stock"
            className="flex-1 cursor-pointer text-[length:var(--font-size-body-sm)] text-fg"
          >
            In stock only
          </label>
          <Switch
            id="filter-in-stock"
            checked={Boolean(filters.inStock)}
            onCheckedChange={(checked) =>
              onChange({ ...filters, inStock: checked ? true : undefined })
            }
            aria-label="In stock only"
          />
        </div>

        {showCategorySection ? (
          <Section
            title="Category"
            count={filters.category ? 1 : 0}
            defaultOpen
          >
            <RadioGroup
              value={filters.category ?? ''}
              onValueChange={(v) =>
                onChange({ ...filters, category: v ? v : undefined })
              }
              className="flex flex-col gap-0"
            >
              {categoryOptions.map((option) => {
                const id = `category-${option.id}`;
                return (
                  <OptionRow
                    key={option.id}
                    htmlFor={id}
                    label={option.label}
                    count={option.count}
                    selected={filters.category === option.id}
                  >
                    <RadioItem id={id} value={option.id} />
                  </OptionRow>
                );
              })}
            </RadioGroup>
          </Section>
        ) : null}

        {brandOptions.length > 0 ? (
          <Section
            title="Brand"
            count={filters.brand.length}
            defaultOpen={filters.brand.length > 0}
          >
            <div className="flex flex-col">
              {showBrandSearch ? (
                <div className="relative flex items-center pb-2">
                  <Search
                    aria-hidden="true"
                    strokeWidth={1.5}
                    className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-fg-muted"
                  />
                  <input
                    type="search"
                    value={brandQuery}
                    onChange={(e) => setBrandQuery(e.target.value)}
                    placeholder={`Filter ${brandOptions.length} brands`}
                    aria-label="Filter brand list"
                    className="w-full bg-bg border border-border rounded-[6px] pl-9 pr-3 py-2 text-[length:var(--font-size-micro)] font-body text-fg placeholder:text-fg-muted/70 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-bg"
                  />
                </div>
              ) : null}
              <div
                className={
                  showBrandSearch
                    ? 'max-h-[260px] overflow-y-auto pr-1'
                    : 'flex flex-col'
                }
              >
                {filteredBrands.length === 0 ? (
                  <p className="py-2 text-[length:var(--font-size-micro)] text-fg-muted">
                    No brands match.
                  </p>
                ) : (
                  filteredBrands.map((option) => {
                    const id = `brand-${option.id}`;
                    const checked = filters.brand.includes(option.id);
                    return (
                      <OptionRow
                        key={option.id}
                        htmlFor={id}
                        label={option.label}
                        count={option.count}
                        selected={checked}
                      >
                        <Checkbox
                          id={id}
                          checked={checked}
                          onCheckedChange={() =>
                            onChange({
                              ...filters,
                              brand: toggleMulti(filters.brand, option.id),
                            })
                          }
                        />
                      </OptionRow>
                    );
                  })
                )}
              </div>
            </div>
          </Section>
        ) : null}

        <Section title="Gender" count={filters.gender ? 1 : 0}>
          <RadioGroup
            value={filters.gender ?? ''}
            onValueChange={(v) =>
              onChange({ ...filters, gender: v ? v : undefined })
            }
            className="flex flex-col gap-0"
          >
            {GENDER_OPTIONS.map((option) => {
              const id = `gender-${option.id}`;
              return (
                <OptionRow
                  key={option.id}
                  htmlFor={id}
                  label={option.label}
                  selected={filters.gender === option.id}
                >
                  <RadioItem id={id} value={option.id} />
                </OptionRow>
              );
            })}
          </RadioGroup>
        </Section>

        <Section title="Price" count={filters.price.length}>
          <div className="flex flex-col">
            {PRICE_BANDS.map((option) => {
              const id = `price-${option.id}`;
              const checked = filters.price.includes(option.id);
              return (
                <OptionRow
                  key={option.id}
                  htmlFor={id}
                  label={option.label}
                  selected={checked}
                >
                  <Checkbox
                    id={id}
                    checked={checked}
                    onCheckedChange={() =>
                      onChange({
                        ...filters,
                        price: toggleMulti(filters.price, option.id),
                      })
                    }
                  />
                </OptionRow>
              );
            })}
          </div>
        </Section>
      </div>

      {isDrawer ? (
        <div className="mt-auto flex items-center gap-3 border-t border-border-dark pt-4">
          <button
            type="button"
            onClick={clearAll}
            disabled={activeCount === 0}
            className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted underline-offset-4 transition-colors duration-[var(--duration-fast)] hover:text-fg hover:underline disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg min-h-[44px] px-2"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={onApply}
            className="ml-auto inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 bg-fg px-6 text-bg font-micro uppercase tracking-[0.08em] text-[length:var(--font-size-micro)] transition-opacity duration-[var(--duration-fast)] hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            {typeof resultCount === 'number'
              ? `Show ${resultCount} ${resultCount === 1 ? 'result' : 'results'}`
              : 'Show results'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
