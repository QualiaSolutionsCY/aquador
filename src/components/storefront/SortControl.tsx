'use client';

/**
 * SortControl. Inline horizontal sort row for the shop storefront (SHOP-02).
 *
 * Editorial spec (DESIGN.md §10b): NO Card wrapper. A `font-micro` "Order by"
 * label sits left of a `Tabs` row with four options. Each tab carries an
 * underline micro-shift on hover and a persistent underline when active so
 * the change-of-order moment reads as a typographic cue, not a chrome toggle.
 *
 * Motion: 150ms (`--duration-fast`) transform on the underline span, eased
 * with `--ease-out-quart`. `prefers-reduced-motion` is zeroed by tokens.css.
 *
 * Props are controlled: caller owns the sort value and the URL-write side
 * effect. This keeps `SortControl` reusable on /shop and /shop/[category].
 */

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { SORT_OPTIONS } from '@/lib/constants';
import type { SortKey } from '@/lib/shop/filter-schema';

export interface SortControlProps {
  value: SortKey;
  onChange: (next: SortKey) => void;
}

export default function SortControl({ value, onChange }: SortControlProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <span className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted">
        Order by
      </span>
      <Tabs
        value={value}
        onValueChange={(v) => onChange(v as SortKey)}
      >
        <TabsList className="flex flex-wrap gap-x-2 gap-y-1 overflow-x-auto border-b-0">
          {SORT_OPTIONS.map((option) => (
            <TabsTrigger
              key={option.id}
              value={option.id}
              className="group relative overflow-hidden min-h-[44px]"
            >
              <span>{option.label}</span>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-accent -translate-x-full transition-transform duration-[var(--duration-fast)] ease-[var(--ease-out-quart)] group-hover:translate-x-0 group-data-[state=active]:translate-x-0"
              />
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
