import 'server-only';

import * as Sentry from '@sentry/nextjs';
import { createAdminClient } from './admin';
import type { Database, Json } from './types';

/**
 * admin-service.ts — Deep module owning every admin dashboard query.
 *
 * Server-only. The `import 'server-only'` directive at the top guarantees
 * the service-role-backed client never reaches a client bundle. All
 * functions return typed, stable shapes and degrade to safe defaults on
 * error (Sentry breadcrumb + empty/zero values) so the dashboard never
 * crashes if Supabase is briefly unreachable.
 *
 * Order-status note: the schema's `order_status` enum does NOT include
 * 'paid' or 'fulfilled'. Revenue-bearing statuses on this codebase are
 * the post-payment states: 'confirmed' | 'processing' | 'shipped' |
 * 'delivered'. The Stripe webhook writes 'confirmed' on successful
 * checkout (src/app/api/webhooks/stripe/route.ts).
 */

type OrderRow = Database['public']['Tables']['orders']['Row'];
type CustomerRow = Database['public']['Tables']['customers']['Row'];
type OrderStatus = Database['public']['Enums']['order_status'];

/** Discriminated period selector consumed by every time-windowed query. */
export type Period = '7d' | '30d' | '90d';

/** Order-status set considered "revenue-bearing" — excludes pending/cancelled/refunded. */
const REVENUE_STATUSES: OrderStatus[] = ['confirmed', 'processing', 'shipped', 'delivered'];

/** EUR currency constant per PROJECT.md (storefront is EUR-only). */
const CURRENCY = 'EUR' as const;

/** Resolve a period string to a current + previous comparable window. */
function periodToInterval(period: Period): {
  start: Date;
  end: Date;
  previousStart: Date;
  previousEnd: Date;
} {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const now = new Date();
  const start = new Date(now.getTime() - days * 24 * 3600 * 1000);
  const previousStart = new Date(start.getTime() - days * 24 * 3600 * 1000);
  return { start, end: now, previousStart, previousEnd: start };
}

/** Sentry-aware error breadcrumb + safe fallback. Never throws. */
function reportSafe(scope: string, err: unknown, extra?: Record<string, unknown>) {
  try {
    Sentry.captureMessage(`admin-service: ${scope}`, {
      level: 'warning',
      extra: { error: err instanceof Error ? err.message : String(err), ...extra },
    });
  } catch {
    // Sentry not configured in test/local — swallow.
  }
}

// -----------------------------------------------------------------------------
// Pure helper — exported separately for unit testing.
// -----------------------------------------------------------------------------

/** A single line-item parsed out of an order's `items` JSONB column. */
type ParsedOrderItem = {
  name: string;
  quantity: number;
  price: number;
};

/** Aggregated top-products row produced by `parseOrderItemsForTopProducts`. */
export type TopProductRow = {
  productId: string;
  name: string;
  units: number;
  revenue: number;
};

/** Narrow input shape for the pure aggregator. */
type OrderItemsShard = { id?: string; items: Json };

/**
 * Pure JSON-aggregation helper. Walks every order's `items` JSONB,
 * groups line items by `name` (the only stable identifier present in
 * the cart-to-order serialization at src/app/api/webhooks/stripe/route.ts),
 * sums quantities and `quantity * price` into revenue. Malformed orders
 * are skipped with a Sentry breadcrumb and never throw.
 *
 * NOTE on identifier: the Stripe webhook stores items as
 * `{ name, quantity, price, productType? }`. There is no product `id`
 * field carried into `orders.items`. We use `name` as both the
 * `productId` grouping key and the display name. If the serialization
 * changes to include an id later, switch the grouping key here without
 * touching callers.
 */
export function parseOrderItemsForTopProducts(orders: OrderItemsShard[]): TopProductRow[] {
  const acc = new Map<string, { name: string; units: number; revenue: number }>();

  for (const order of orders) {
    const raw = order.items;
    if (!Array.isArray(raw)) {
      if (raw !== null && raw !== undefined) {
        reportSafe('order.items shape unexpected (not array)', null, { orderId: order.id });
      }
      continue;
    }

    for (const item of raw) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
      const obj = item as Record<string, unknown>;
      const name = typeof obj.name === 'string' ? obj.name : null;
      const quantityRaw = obj.quantity;
      const priceRaw = obj.price ?? obj.unitPrice;
      const quantity = typeof quantityRaw === 'number' ? quantityRaw : Number(quantityRaw);
      const price = typeof priceRaw === 'number' ? priceRaw : Number(priceRaw);

      if (!name || !Number.isFinite(quantity) || !Number.isFinite(price)) {
        reportSafe('order.items entry malformed', null, { orderId: order.id });
        continue;
      }

      const existing = acc.get(name) ?? { name, units: 0, revenue: 0 };
      existing.units += quantity;
      existing.revenue += quantity * price;
      acc.set(name, existing);
    }
  }

  return Array.from(acc.entries()).map(([key, v]) => ({
    productId: key,
    name: v.name,
    units: v.units,
    revenue: v.revenue,
  }));
}

// -----------------------------------------------------------------------------
// Metric query functions
// -----------------------------------------------------------------------------

/** Returns the revenue total for `period` vs the immediately-prior comparable window. */
export async function getRevenueMetrics(period: Period): Promise<{
  current: number;
  previous: number;
  deltaPct: number;
  currency: typeof CURRENCY;
}> {
  const defaults = { current: 0, previous: 0, deltaPct: 0, currency: CURRENCY };
  try {
    const { start, end, previousStart, previousEnd } = periodToInterval(period);
    const supabase = createAdminClient();

    const [currentRes, previousRes] = await Promise.all([
      supabase
        .from('orders')
        .select('total')
        .gte('created_at', start.toISOString())
        .lt('created_at', end.toISOString())
        .in('status', REVENUE_STATUSES),
      supabase
        .from('orders')
        .select('total')
        .gte('created_at', previousStart.toISOString())
        .lt('created_at', previousEnd.toISOString())
        .in('status', REVENUE_STATUSES),
    ]);

    if (currentRes.error) {
      reportSafe('getRevenueMetrics current query', currentRes.error);
      return defaults;
    }
    if (previousRes.error) {
      reportSafe('getRevenueMetrics previous query', previousRes.error);
      return defaults;
    }

    const sum = (rows: Array<{ total: number }>) =>
      rows.reduce((a, r) => a + (typeof r.total === 'number' ? r.total : 0), 0);
    const current = sum(currentRes.data ?? []);
    const previous = sum(previousRes.data ?? []);
    const deltaPct = previous === 0 ? (current === 0 ? 0 : 1) : (current - previous) / previous;

    return { current, previous, deltaPct, currency: CURRENCY };
  } catch (err) {
    reportSafe('getRevenueMetrics unexpected', err);
    return defaults;
  }
}

/** Returns the count and AOV (average order value) for the period. Revenue-bearing statuses only. */
export async function getOrderMetrics(period: Period): Promise<{ count: number; aov: number }> {
  const defaults = { count: 0, aov: 0 };
  try {
    const { start, end } = periodToInterval(period);
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('orders')
      .select('total')
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString())
      .in('status', REVENUE_STATUSES);

    if (error) {
      reportSafe('getOrderMetrics', error);
      return defaults;
    }

    const rows = data ?? [];
    const count = rows.length;
    const total = rows.reduce((a, r) => a + (typeof r.total === 'number' ? r.total : 0), 0);
    const aov = count === 0 ? 0 : total / count;
    return { count, aov };
  } catch (err) {
    reportSafe('getOrderMetrics unexpected', err);
    return defaults;
  }
}

/**
 * Returns orders / sessions / rate. Sessions sourced from `site_visitors`
 * (distinct `session_id` in the window) — this is the planned fallback
 * since Vercel Analytics Data API integration is out of scope for Phase 2.
 */
export async function getConversionRate(period: Period): Promise<{
  orders: number;
  sessions: number;
  rate: number;
  source: 'site_visitors';
}> {
  const defaults = { orders: 0, sessions: 0, rate: 0, source: 'site_visitors' as const };
  try {
    const { start, end } = periodToInterval(period);
    const supabase = createAdminClient();

    const [orderRes, visitorRes] = await Promise.all([
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', start.toISOString())
        .lt('created_at', end.toISOString())
        .in('status', REVENUE_STATUSES),
      supabase
        .from('site_visitors')
        .select('session_id')
        .gte('last_seen', start.toISOString())
        .lt('last_seen', end.toISOString()),
    ]);

    if (orderRes.error) {
      reportSafe('getConversionRate orders', orderRes.error);
      return defaults;
    }
    if (visitorRes.error) {
      reportSafe('getConversionRate visitors', visitorRes.error);
      return defaults;
    }

    const ordersCount = orderRes.count ?? 0;
    const distinctSessions = new Set(
      (visitorRes.data ?? []).map((r) => r.session_id).filter((s): s is string => typeof s === 'string')
    );
    const sessions = distinctSessions.size;
    const rate = sessions === 0 ? 0 : ordersCount / sessions;

    return { orders: ordersCount, sessions, rate, source: 'site_visitors' };
  } catch (err) {
    reportSafe('getConversionRate unexpected', err);
    return defaults;
  }
}

/**
 * Returns customer totals + LTV bucketing. Sourced from denormalized
 * `customers.total_spent` / `customers.total_orders` — no join required.
 */
export async function getCustomerMetrics(): Promise<{
  total: number;
  repeatCount: number;
  avgLtv: number;
  ltvBuckets: { lt50: number; lt200: number; lt500: number; gte500: number };
}> {
  const defaults = {
    total: 0,
    repeatCount: 0,
    avgLtv: 0,
    ltvBuckets: { lt50: 0, lt200: 0, lt500: 0, gte500: 0 },
  };
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('customers')
      .select('total_spent, total_orders');

    if (error) {
      reportSafe('getCustomerMetrics', error);
      return defaults;
    }

    const rows: Array<Pick<CustomerRow, 'total_spent' | 'total_orders'>> = data ?? [];
    const total = rows.length;
    const repeatCount = rows.filter((r) => (r.total_orders ?? 0) >= 2).length;
    const spendSum = rows.reduce((a, r) => a + (typeof r.total_spent === 'number' ? r.total_spent : 0), 0);
    const avgLtv = total === 0 ? 0 : spendSum / total;

    const ltvBuckets = { lt50: 0, lt200: 0, lt500: 0, gte500: 0 };
    for (const r of rows) {
      const v = typeof r.total_spent === 'number' ? r.total_spent : 0;
      if (v < 50) ltvBuckets.lt50 += 1;
      else if (v < 200) ltvBuckets.lt200 += 1;
      else if (v < 500) ltvBuckets.lt500 += 1;
      else ltvBuckets.gte500 += 1;
    }

    return { total, repeatCount, avgLtv, ltvBuckets };
  } catch (err) {
    reportSafe('getCustomerMetrics unexpected', err);
    return defaults;
  }
}

/**
 * Returns the top `limit` products by revenue across the period. Aggregates
 * the `orders.items` JSONB column via the pure helper above.
 */
export async function getTopProducts(period: Period, limit = 5): Promise<TopProductRow[]> {
  try {
    const { start, end } = periodToInterval(period);
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('orders')
      .select('id, items')
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString())
      .in('status', REVENUE_STATUSES);

    if (error) {
      reportSafe('getTopProducts', error);
      return [];
    }

    const aggregated = parseOrderItemsForTopProducts(
      (data ?? []).map((o) => ({ id: o.id, items: o.items }))
    );
    aggregated.sort((a, b) => b.revenue - a.revenue);
    return aggregated.slice(0, limit);
  } catch (err) {
    reportSafe('getTopProducts unexpected', err);
    return [];
  }
}

/** Shape returned by `getRecentOrders` — a thin projection over the orders Row. */
export type RecentOrderRow = Pick<
  OrderRow,
  'id' | 'total' | 'status' | 'customer_email' | 'customer_name' | 'created_at' | 'order_source'
>;

/** Returns the latest `limit` orders ordered by `created_at` desc. */
export async function getRecentOrders(limit = 10): Promise<RecentOrderRow[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('orders')
      .select('id, total, status, customer_email, customer_name, created_at, order_source')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      reportSafe('getRecentOrders', error);
      return [];
    }

    return data ?? [];
  } catch (err) {
    reportSafe('getRecentOrders unexpected', err);
    return [];
  }
}
