'use client';

/**
 * FilterPanel. Inline-accordion-editorial filter container for the shop
 * storefront (SHOP-01).
 *
 * Editorial spec (DESIGN.md §10b): NO Card wrapper. A "Refine" eyebrow with
 * a clear-filters affordance sits over a chip strip of active filters,
 * followed by four collapsible disclosure rows separated by hairlines:
 *
 *   Family  (multi, checkbox)
 *   Brand   (multi, checkbox)
 *   Gender  (single, radio)
 *   Price   (multi, checkbox)
 *
 * Each row opens INLINE via a CSS grid-rows transition (0fr to 1fr) with
 * `--duration-base` and `--ease-out-quart`. No JS height measurement, no
 * popouts. Motion is zeroed under `prefers-reduced-motion` by tokens.css.
 *
 * Controlled component: caller owns the `ShopFilters` value and writes the
 * URL. The `hideCategoryFilter` prop exists for parity with `ProductGrid`
 * and reserves space for a future category-on-category page; it does not
 * affect the four rows rendered here.
 */

import { useMemo, useState, type ReactNode } from 'react';
import { Plus, Minus } from 'lucide-react';
import { Checkbox } from '@/components/ui/Checkbox';
import { RadioGroup, RadioItem } from '@/components/ui/Radio';
import { Tag } from '@/components/ui/Tag';
import {
  BRAND_OPTIONS,
  GENDER_OPTIONS,
  NOTES_FAMILY_OPTIONS,
  PRICE_BANDS,
} from '@/lib/constants';
import type { ShopFilters } from '@/lib/shop/filter-schema';

export interface FilterPanelProps {
  filters: ShopFilters;
  onChange: (next: ShopFilters) => void;
  /** Reserved for category-scoped pages. Does not affect the four rows. */
  hideCategoryFilter?: boolean;
}

type ActiveChip = {
  key: string;
  label: string;
  remove: () => void;
};

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
  const headerId = `filter-section-${title.toLowerCase()}`;
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
            <span className="ml-2 text-fg-muted">({count})</span>
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
  children,
}: {
  htmlFor: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="flex items-center gap-3 py-2 min-h-[44px] cursor-pointer text-fg"
    >
      {children}
      <span className="text-[length:var(--font-size-body)] text-fg">
        {label}
      </span>
    </label>
  );
}

export default function FilterPanel({
  filters,
  onChange,
}: FilterPanelProps) {
  const activeCount =
    filters.family.length +
    filters.brand.length +
    filters.price.length +
    (filters.gender ? 1 : 0);

  const chips: ActiveChip[] = useMemo(() => {
    const out: ActiveChip[] = [];
    filters.family.forEach((id) => {
      const option = NOTES_FAMILY_OPTIONS.find((o) => o.id === id);
      if (!option) return;
      out.push({
        key: `family-${id}`,
        label: option.label,
        remove: () =>
          onChange({ ...filters, family: filters.family.filter((v) => v !== id) }),
      });
    });
    filters.brand.forEach((id) => {
      const option = BRAND_OPTIONS.find((o) => o.id === id);
      if (!option) return;
      out.push({
        key: `brand-${id}`,
        label: option.label,
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
  }, [filters, onChange]);

  const clearAll = () => {
    onChange({
      category: filters.category,
      sort: filters.sort,
      brand: [],
      family: [],
      price: [],
      gender: undefined,
      search: filters.search,
    });
  };

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between gap-4 pb-4">
        <h2 className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg">
          Refine
        </h2>
        {activeCount > 0 ? (
          <button
            type="button"
            onClick={clearAll}
            className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-accent-deep underline-offset-4 transition-colors duration-[var(--duration-fast)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg min-h-[44px]"
          >
            Clear filters
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

      <Section title="Family" count={filters.family.length} defaultOpen>
        <div className="flex flex-col">
          {NOTES_FAMILY_OPTIONS.map((option) => {
            const id = `family-${option.id}`;
            const checked = filters.family.includes(option.id);
            return (
              <OptionRow key={option.id} htmlFor={id} label={option.label}>
                <Checkbox
                  id={id}
                  checked={checked}
                  onCheckedChange={() =>
                    onChange({
                      ...filters,
                      family: toggleMulti(filters.family, option.id),
                    })
                  }
                />
              </OptionRow>
            );
          })}
        </div>
      </Section>

      <Section title="Brand" count={filters.brand.length}>
        <div className="flex flex-col">
          {BRAND_OPTIONS.map((option) => {
            const id = `brand-${option.id}`;
            const checked = filters.brand.includes(option.id);
            return (
              <OptionRow key={option.id} htmlFor={id} label={option.label}>
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
        </div>
      </Section>

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
