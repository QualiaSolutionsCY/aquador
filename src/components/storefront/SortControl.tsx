'use client';

/**
 * SortControl. Inline horizontal sort row for the shop storefront.
 *
 * Editorial spec (DESIGN.md §10b): NO Card wrapper. A `font-micro` "Order by"
 * label sits left of a `Tabs` row with four options. The active tab carries
 * a persistent underline so the current sort reads as a typographic cue.
 *
 * The previous build animated an underline span sliding in from the left on
 * hover. That micro-shift competed with the FilterPanel for attention and,
 * combined with the broken filter sections, made the whole row feel like
 * decoration rather than control. We drop the slide and rely on the
 * data-state=active underline plus a subtle color shift on hover for state.
 *
 * Motion: `--duration-fast` color transition only. `prefers-reduced-motion`
 * is zeroed by tokens.css.
 *
 * Props are controlled: caller owns the sort value and the URL-write side
 * effect. This keeps `SortControl` reusable across the shop route family.
 */

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
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
        <TabsList className="flex flex-wrap gap-x-4 gap-y-1 overflow-x-auto border-b-0">
          {SORT_OPTIONS.map((option) => (
            <TabsTrigger
              key={option.id}
              value={option.id}
              className="min-h-[44px] text-fg-muted transition-colors duration-[var(--duration-fast)] hover:text-fg data-[state=active]:text-fg"
            >
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {/* Hidden TabsContent stubs. Radix TabsTrigger always renders
            `aria-controls` pointing at the paired content panel id; without
            the panel in the DOM, axe-core flags it as
            `aria-valid-attr-value` (critical). The sort UX is URL-driven —
            the actual result list lives outside this Tabs root — so we
            mount empty panels to satisfy the ARIA contract. */}
        {SORT_OPTIONS.map((option) => (
          <TabsContent
            key={option.id}
            value={option.id}
            className="sr-only mt-0"
            aria-hidden="true"
          />
        ))}
      </Tabs>
    </div>
  );
}
