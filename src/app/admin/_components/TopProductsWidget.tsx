'use client';

/**
 * TopProductsWidget — top-5 products by revenue with period tabs
 * (Phase 2 Task 5, DASH-04).
 *
 * The only widget on `/admin` whose period the operator toggles per
 * session — revenue / orders / AOV use a fixed 30d-vs-prior-30d window.
 * Receives the initial 30d slice as a prop from the server-rendered
 * page; tab changes call the `getTopProductsAction` server action,
 * wrapped in `useTransition` so the UI never blocks on the network.
 *
 * Layout: hairline-divider list (not a Card grid). Rank / name /
 * units / revenue, four columns. Empty state stays in the layout (no
 * row collapse) so the section height doesn't jump when a new store
 * has no orders yet.
 */

import { useState, useTransition } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import type { Period, TopProductRow } from '@/lib/supabase/admin-service';
import { getTopProductsAction } from './actions';

const EUR = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
});
const INT = new Intl.NumberFormat('en-IE');

const PERIOD_LABELS: ReadonlyArray<{ value: Period; label: string }> = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
];

export interface TopProductsWidgetProps {
  /** Initial 30d ranking rendered server-side so first paint is data. */
  initialRows: TopProductRow[];
  /** Initial period — must match the slice the server fetched. */
  initialPeriod: Period;
}

export function TopProductsWidget({
  initialRows,
  initialPeriod,
}: TopProductsWidgetProps) {
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const [rows, setRows] = useState<TopProductRow[]>(initialRows);
  const [isPending, startTransition] = useTransition();

  function handlePeriodChange(next: string) {
    const nextPeriod = next as Period;
    if (nextPeriod === period) return;
    setPeriod(nextPeriod);
    startTransition(async () => {
      const fresh = await getTopProductsAction(nextPeriod, 5);
      setRows(fresh);
    });
  }

  // Revenue in `orders.total` is Stripe cents (see webhook); convert to
  // major units for display. The aggregator multiplied quantity * price
  // pulled from the order items JSONB which also carries cents.
  const formatRevenue = (cents: number) => EUR.format(cents / 100);

  return (
    <section
      aria-label="Top products"
      aria-busy={isPending}
      className="flex flex-col"
    >
      <header className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="font-display text-[20px] leading-tight text-fg">
          Top products
        </h2>
        <Tabs value={period} onValueChange={handlePeriodChange}>
          <TabsList className="border-b-0">
            {PERIOD_LABELS.map((p) => (
              <TabsTrigger key={p.value} value={p.value}>
                {p.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </header>

      <ol className="flex flex-col">
        {rows.length === 0 ? (
          <li className="flex items-center justify-center border-b border-border py-8">
            <span className="font-body text-[14px] text-fg-muted">
              No revenue in this window yet.
            </span>
          </li>
        ) : (
          rows.map((row, idx) => (
            <li
              key={row.productId}
              className="flex items-center gap-4 border-b border-border py-3 last:border-b-0"
            >
              <span className="w-6 shrink-0 font-micro text-[12px] uppercase tracking-[0.05em] text-fg-muted [font-feature-settings:'tnum'_1]">
                {idx + 1}
              </span>
              <span className="min-w-0 flex-1 truncate font-body text-[14px] text-fg">
                {row.name}
              </span>
              <span className="w-16 shrink-0 text-right font-body text-[13px] text-fg-muted [font-feature-settings:'tnum'_1]">
                {INT.format(row.units)}
              </span>
              <span className="w-24 shrink-0 text-right font-display text-[14px] text-fg [font-feature-settings:'tnum'_1]">
                {formatRevenue(row.revenue)}
              </span>
            </li>
          ))
        )}
      </ol>
    </section>
  );
}

export default TopProductsWidget;
