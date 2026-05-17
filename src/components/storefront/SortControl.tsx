'use client';

/**
 * SortControl. Editorial sort dropdown for the shop storefront.
 *
 * Renders a labelled Select-like trigger ("Sort by: Featured ▾") that opens
 * a popover with the four sort keys. Sits at the top-right of the results
 * grid (not inside the filter panel) so sort reads as a property of the
 * results, not of the refine controls.
 *
 * The native HTML <select> is used (rather than @radix-ui/react-select)
 * because the open behaviour and keyboard a11y on a single-select sort
 * lookup are already perfect natively, and a native picker collapses to
 * the OS picker on mobile (closer-to-native shopping feel). The trigger is
 * styled as a typographic affordance — micro-cap label, body-weight value,
 * underline-on-hover, chevron-down — to match the hairline editorial system.
 *
 * Motion: `--duration-fast` color transitions only. `prefers-reduced-motion`
 * zeroed by tokens.css.
 *
 * Controlled: caller owns the sort value and the URL-write side effect.
 */

import { ChevronDown } from 'lucide-react';
import { SORT_OPTIONS } from '@/lib/constants';
import type { SortKey } from '@/lib/shop/filter-schema';

export interface SortControlProps {
  value: SortKey;
  onChange: (next: SortKey) => void;
}

export default function SortControl({ value, onChange }: SortControlProps) {
  return (
    <label className="group inline-flex items-center gap-2 cursor-pointer min-h-[44px]">
      <span className="font-micro uppercase tracking-[0.08em] text-[length:var(--font-size-micro)] text-fg-muted">
        Sort by
      </span>
      <span className="relative inline-flex items-center">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as SortKey)}
          aria-label="Sort results"
          className="appearance-none bg-transparent pr-6 pl-1 py-1 font-body text-[length:var(--font-size-body-sm)] text-fg cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors duration-[var(--duration-fast)] group-hover:text-accent-deep"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          strokeWidth={1.5}
          className="pointer-events-none absolute right-0 h-4 w-4 text-fg-muted transition-colors duration-[var(--duration-fast)] group-hover:text-fg"
        />
      </span>
    </label>
  );
}
