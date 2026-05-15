import 'server-only';

/**
 * /admin — operator dashboard (Phase 2 Task 5).
 *
 * Server component coordinator. Calls `admin-service` directly via
 * `Promise.all` so the six metric tiles, the top-products list, the
 * LTV buckets, and the recent-orders table all render on first paint —
 * no spinner waterfall, no skeleton flash.
 *
 * Layout (DESIGN.md §10, magazine-spread editorial stack):
 *
 *   1. Page header               display heading + meta byline
 *   2. Six MetricCards           responsive grid (2 / 3 / 6 cols)
 *   3. Top products + LTV        side-by-side on lg+, stacked on md-
 *   4. Recent orders             full-width via AdminTable
 *
 * Revenue is stored as Stripe cents on `orders.total` (see the Stripe
 * webhook); the formatter divides by 100. Conversion rate uses the
 * `site_visitors` table as the denominator — the "via site visits"
 * caption on the tile makes the source transparent to the operator
 * per PRODUCT.md voice ("we address, we don't announce").
 */

import {
  getConversionRate,
  getCustomerMetrics,
  getOrderMetrics,
  getRecentOrders,
  getRevenueMetrics,
  getTopProducts,
} from '@/lib/supabase/admin-service';
import { MetricCard } from './_components/MetricCard';
import { TopProductsWidget } from './_components/TopProductsWidget';
import { LtvBuckets } from './_components/LtvBuckets';
import { RecentOrdersWidget } from './_components/RecentOrdersWidget';

const EUR = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
});
const INT = new Intl.NumberFormat('en-IE');
const PCT = new Intl.NumberFormat('en-IE', {
  style: 'percent',
  maximumFractionDigits: 2,
});

export default async function AdminDashboardPage() {
  const [
    revenue,
    orderMetrics,
    conversion,
    customers,
    recentOrders,
    initialTopProducts,
  ] = await Promise.all([
    getRevenueMetrics('30d'),
    getOrderMetrics('30d'),
    getConversionRate('30d'),
    getCustomerMetrics(),
    getRecentOrders(10),
    getTopProducts('30d', 5),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2 border-b border-border pb-6">
        <p className="font-micro text-[12px] uppercase tracking-[0.05em] text-fg-muted">
          Dashboard
        </p>
        <h1 className="font-display text-[28px] leading-tight text-fg">
          Operator overview
        </h1>
        <p className="font-body text-[14px] text-fg-muted">
          Trailing 30 days versus the prior 30. Counts and revenue update on
          page refresh.
        </p>
      </header>

      {/* Metric grid — 2 cols mobile / 3 cols md / 6 cols lg. */}
      <section
        aria-label="Headline metrics"
        className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6"
      >
        <MetricCard
          label="Revenue 30d"
          value={EUR.format(revenue.current / 100)}
          delta={revenue.deltaPct}
          caption="vs prior 30d"
        />
        <MetricCard
          label="Orders 30d"
          value={INT.format(orderMetrics.count)}
        />
        <MetricCard
          label="AOV"
          value={EUR.format(orderMetrics.aov / 100)}
        />
        <MetricCard
          label="Conversion"
          value={PCT.format(conversion.rate)}
          caption="via site visits"
        />
        <MetricCard
          label="Customers"
          value={INT.format(customers.total)}
        />
        <MetricCard
          label="Avg LTV"
          value={EUR.format(customers.avgLtv / 100)}
        />
      </section>

      {/* Side-by-side widgets — top products (client) + LTV buckets (server). */}
      <section
        aria-label="Product and customer breakdown"
        className="grid grid-cols-1 gap-10 lg:grid-cols-2"
      >
        <TopProductsWidget
          initialRows={initialTopProducts}
          initialPeriod="30d"
        />
        <LtvBuckets buckets={customers.ltvBuckets} />
      </section>

      <RecentOrdersWidget orders={recentOrders} />
    </div>
  );
}
