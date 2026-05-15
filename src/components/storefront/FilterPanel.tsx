'use client';

/**
 * FilterPanel. Inline-accordion-editorial filter container for the shop
 * storefront.
 *
 * Editorial spec (DESIGN.md §10b): NO Card wrapper. Active-filter chips
 * sit at the TOP of the panel full-width with a "Clear all" link aligned
 * right, followed by collapsible disclosure rows separated by hairlines:
 *
 *   In stock only  (single switch, top of stack)
 *   Category       (multi, checkbox)   (hidden when hideCategoryFilter)
 *   Brand          (multi, checkbox)   (top 8 + "Show all brands" reveal)
 *   Gender         (single, radio)
 *   Price          (multi, checkbox)
 *
 * Each row opens INLINE via a CSS grid-rows transition (0fr to 1fr) with
 * `--duration-base` and `--ease-out-quart`. No JS height measurement, no
 * popouts. Motion is zeroed under `prefers-reduced-motion` by tokens.css.
 *
 * Brand options are passed in by the server-side page load so the list
 * reflects the live catalogue, not a hardcoded enum. The "family" filter
 * has been removed because no products carried the family tags it was
 * supposed to match.
 *
 * Controlled component: caller owns the `ShopFilters` value and writes
 * the URL.
 */

import { useMemo, useState, type ReactNode } from 'react';
import { Plus, Minus } from 'lucide-react';
import { Checkbox } from '@/components/ui/Checkbox';
import { RadioGroup, RadioItem } from '@/components/ui/Radio';
import { Switch } from '@/components/ui/Switch';
import { Tag } from '@/components/ui/Tag';
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
  /** Live brand list from the catalogue. Pass [] to suppress the section. */
  brandOptions: BrandOption[];
  /** Category list. Pass [] to suppress the section. */
  categoryOptions: CategoryOption[];
  /** Hide the category section (used on /shop/[category] where path constrains it). */
  hideCategoryFilter?: boolean;
}

type ActiveChip = {
  key: string;
  label: string;
  remove: () => void;
};

/** How many brands to show before the "Show all brands" reveal. */
const BRAND_PRIMARY_COUNT = 8;

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
    <div className="border-t border-border">
      <button
        type="button"
        id={headerId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 py-4 text-left min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        <span className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg">
          {title}
          {count > 0 ? (
            <span className="ml-2 text-fg-muted">{`· ${count}`}</span>
          ) : null}
        </span>
        {open ? (
          <Minus
            aria-hidden="true"
            strokeWidth={1.5}
            className="h-4 w-4 text-fg-muted transition-colors duration-[var(--duration-fast)]"
          />
        ) : (
          <Plus
            aria-hidden="true"
            strokeWidth={1.5}
            className="h-4 w-4 text-fg-muted transition-colors duration-[var(--duration-fast)]"
          />
        )}
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
  children,
}: {
  htmlFor: string;
  label: string;
  count?: number;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="flex items-center gap-3 py-2 min-h-[44px] cursor-pointer text-fg"
    >
      {children}
      <span className="flex-1 text-[length:var(--font-size-body)] text-fg">
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
}: FilterPanelProps) {
  const [brandsExpanded, setBrandsExpanded] = useState(false);

  const showCategorySection = !hideCategoryFilter && categoryOptions.length > 0;

  const activeCount =
    filters.brand.length +
    filters.price.length +
    (filters.gender ? 1 : 0) +
    (filters.inStock ? 1 : 0) +
    (showCategorySection && filters.category ? 1 : 0);

  // Lookup maps so chips can resolve labels regardless of which section
  // owns the filter.
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

  const chips: ActiveChip[] = useMemo(() => {
    const out: ActiveChip[] = [];

    if (filters.inStock) {
      out.push({
        key: 'in-stock',
        label: 'In stock only',
        remove: () => onChange({ ...filters, inStock: undefined }),
      });
    }

    if (showCategorySection && filters.category) {
      const label = categoryLabel.get(filters.category) ?? filters.category;
      out.push({
        key: `category-${filters.category}`,
        label,
        remove: () => onChange({ ...filters, category: undefined }),
      });
    }

    filters.brand.forEach((id) => {
      const label = brandLabel.get(id);
      if (!label) return;
      out.push({
        key: `brand-${id}`,
        label,
        remove: () =>
          onChange({ ...filters, brand: filters.brand.filter((v) => v !== id) }),
      });
    });

    if (filters.gender) {
      const option = GENDER_OPTIONS.find((o) => o.id === filters.gender);
      if (option) {
        out.push({
          key: `gender-${option.id}`,
          label: option.label,
          remove: () => onChange({ ...filters, gender: undefined }),
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
          onChange({ ...filters, price: filters.price.filter((v) => v !== id) }),
      });
    });

    return out;
  }, [filters, onChange, brandLabel, categoryLabel, showCategorySection]);

  const clearAll = () => {
    onChange({
      // Preserve URL-implicit context (category on /shop/[category]) and
      // the user's sort + search intent across "Clear all".
      category: hideCategoryFilter ? filters.category : undefined,
      sort: filters.sort,
      brand: [],
      price: [],
      gender: undefined,
      inStock: undefined,
      search: filters.search,
    });
    setBrandsExpanded(false);
  };

  const primaryBrands = brandOptions.slice(0, BRAND_PRIMARY_COUNT);
  const overflowBrands = brandOptions.slice(BRAND_PRIMARY_COUNT);
  const overflowCount = overflowBrands.length;

  const titleSuffix =
    activeCount > 0 ? ` · ${activeCount} active` : '';

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between gap-4 pb-4">
        <h2 className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg">
          Refine
          {titleSuffix ? (
            <span className="text-fg-muted">{titleSuffix}</span>
          ) : null}
        </h2>
        {activeCount > 0 ? (
          <button
            type="button"
            onClick={clearAll}
            className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-accent-deep underline-offset-4 transition-colors duration-[var(--duration-fast)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg min-h-[44px]"
          >
            Clear all
          </button>
        ) : null}
      </div>

      {chips.length > 0 ? (
        <div className="flex flex-wrap gap-2 pb-4">
          {chips.map((chip) => (
            <Tag
              key={chip.key}
              label={chip.label}
              variant="accent"
              onRemove={chip.remove}
            />
          ))}
        </div>
      ) : null}

      {/* In stock toggle. Sits above the accordions as a single-tap affordance. */}
      <div className="flex items-center justify-between gap-4 border-t border-border py-4 min-h-[44px]">
        <label
          htmlFor="filter-in-stock"
          className="flex-1 cursor-pointer text-[length:var(--font-size-body)] text-fg"
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
            {primaryBrands.map((option) => {
              const id = `brand-${option.id}`;
              const checked = filters.brand.includes(option.id);
              return (
                <OptionRow
                  key={option.id}
                  htmlFor={id}
                  label={option.label}
                  count={option.count}
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
            })}
            {brandsExpanded
              ? overflowBrands.map((option) => {
                  const id = `brand-${option.id}`;
                  const checked = filters.brand.includes(option.id);
                  return (
                    <OptionRow
                      key={option.id}
                      htmlFor={id}
                      label={option.label}
                      count={option.count}
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
              : null}
            {overflowCount > 0 ? (
              <button
                type="button"
                onClick={() => setBrandsExpanded((v) => !v)}
                aria-expanded={brandsExpanded}
                className="mt-2 self-start min-h-[44px] font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-accent-deep underline-offset-4 transition-colors duration-[var(--duration-fast)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                {brandsExpanded ? 'Hide' : `Show all brands (${overflowCount})`}
              </button>
            ) : null}
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
              <OptionRow key={option.id} htmlFor={id} label={option.label}>
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
              <OptionRow key={option.id} htmlFor={id} label={option.label}>
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
  );
}
