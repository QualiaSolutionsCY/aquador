import 'server-only';

import * as Sentry from '@sentry/nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from './admin';
import type { Database, Json } from './types';

/**
 * Caller-supplied Supabase client for write operations. Routes pass their
 * cookie-bound `createClient()` instance through to keep `auth.uid()`
 * non-null in the audit trail and let RLS gate the write (the
 * `is_admin()` predicate added in 20260515110000_security_hardening_from_optimize.sql
 * is dormant when callers use service-role). When omitted, the writer
 * falls back to `createAdminClient()` for back-compat with any code path
 * not yet migrated.
 */
export type AdminWriteClient = SupabaseClient<Database>;

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

// -----------------------------------------------------------------------------
// Products namespace
// -----------------------------------------------------------------------------

type ProductRow = Database['public']['Tables']['products']['Row'];
type ProductInsert = Database['public']['Tables']['products']['Insert'];
type ProductUpdate = Database['public']['Tables']['products']['Update'];

/** Filters accepted by `getAdminProducts`. */
export type AdminProductFilters = {
  search?: string;
  category?: string;
  limit?: number;
};

/** Escape PostgREST `ilike` special characters (mirror of products list page). */
function escapeIlike(query: string): string {
  return query.replace(/[%_\\*()[\]!,]/g, '\\$&');
}

/**
 * List products for the admin grid. service-role: operator needs every product
 * regardless of `is_active` so they can manage hidden listings.
 */
export async function getAdminProducts(
  filters: AdminProductFilters = {}
): Promise<{ data: ProductRow[]; error: string | null }> {
  try {
    const supabase = createAdminClient();
    let query = supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(filters.limit ?? 200);

    if (filters.search) query = query.ilike('name', `%${escapeIlike(filters.search)}%`);
    if (filters.category) {
      query = query.eq('category', filters.category as ProductRow['category']);
    }

    const { data, error } = await query;
    if (error) {
      reportSafe('getAdminProducts', error);
      return { data: [], error: error.message };
    }
    return { data: data ?? [], error: null };
  } catch (err) {
    reportSafe('getAdminProducts unexpected', err);
    return { data: [], error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/** Read a single product by id. service-role: admin sees hidden products too. */
export async function getAdminProductById(
  id: string
): Promise<{ data: ProductRow | null; error: string | null }> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) {
      reportSafe('getAdminProductById', error, { id });
      return { data: null, error: error.message };
    }
    return { data: data ?? null, error: null };
  } catch (err) {
    reportSafe('getAdminProductById unexpected', err);
    return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Insert a new product. When a cookie-bound `client` is supplied (route
 * handlers pass `createClient()` from `lib/supabase/server.ts`), the write
 * is gated by RLS and `auth.uid()` is recorded in the audit trail. With no
 * client argument, falls back to service-role for legacy callers.
 */
export async function createProduct(
  input: ProductInsert,
  client?: AdminWriteClient
): Promise<{ data: ProductRow | null; error: string | null }> {
  try {
    const supabase = client ?? createAdminClient();
    const { data, error } = await supabase
      .from('products')
      .insert(input)
      .select()
      .single();
    if (error) {
      reportSafe('createProduct', error);
      return { data: null, error: error.message };
    }
    return { data, error: null };
  } catch (err) {
    reportSafe('createProduct unexpected', err);
    return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Update a product in place. Pass a cookie-bound `client` from a route to
 * preserve `auth.uid()` in the audit trail; omit for legacy service-role
 * callers.
 */
export async function updateProduct(
  id: string,
  input: ProductUpdate,
  client?: AdminWriteClient
): Promise<{ data: ProductRow | null; error: string | null }> {
  try {
    const supabase = client ?? createAdminClient();
    const { data, error } = await supabase
      .from('products')
      .update(input)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      reportSafe('updateProduct', error, { id });
      return { data: null, error: error.message };
    }
    return { data, error: null };
  } catch (err) {
    reportSafe('updateProduct unexpected', err);
    return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Delete a product. Pass a cookie-bound `client` from a route to preserve
 * `auth.uid()` in the audit trail; omit for legacy service-role callers.
 */
export async function deleteProduct(
  id: string,
  client?: AdminWriteClient
): Promise<{ data: { id: string } | null; error: string | null }> {
  try {
    const supabase = client ?? createAdminClient();
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      reportSafe('deleteProduct', error, { id });
      return { data: null, error: error.message };
    }
    return { data: { id }, error: null };
  } catch (err) {
    reportSafe('deleteProduct unexpected', err);
    return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// -----------------------------------------------------------------------------
// Orders namespace (consumed by Task 2, exposed here per plan §35 serialization)
// -----------------------------------------------------------------------------

export type AdminOrderFilters = {
  status?: OrderStatus;
  search?: string;
  limit?: number;
};

/** List orders for the admin grid. service-role: operator sees every customer's orders. */
export async function getAdminOrders(
  filters: AdminOrderFilters = {}
): Promise<{ data: OrderRow[]; error: string | null }> {
  try {
    const supabase = createAdminClient();
    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(filters.limit ?? 200);

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.search) {
      const escaped = escapeIlike(filters.search);
      query = query.or(`customer_email.ilike.%${escaped}%,customer_name.ilike.%${escaped}%`);
    }

    const { data, error } = await query;
    if (error) {
      reportSafe('getAdminOrders', error);
      return { data: [], error: error.message };
    }
    return { data: data ?? [], error: null };
  } catch (err) {
    reportSafe('getAdminOrders unexpected', err);
    return { data: [], error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/** Read a single order by id. */
export async function getAdminOrderById(
  id: string
): Promise<{ data: OrderRow | null; error: string | null }> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) {
      reportSafe('getAdminOrderById', error, { id });
      return { data: null, error: error.message };
    }
    return { data: data ?? null, error: null };
  } catch (err) {
    reportSafe('getAdminOrderById unexpected', err);
    return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Update an order's fulfillment status. Pass a cookie-bound `client` from
 * a route to preserve `auth.uid()` in the audit trail (RLS gates the
 * write via the `is_admin()` predicate); omit for legacy service-role
 * callers.
 */
export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  client?: AdminWriteClient
): Promise<{ data: OrderRow | null; error: string | null }> {
  try {
    const supabase = client ?? createAdminClient();
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      reportSafe('updateOrderStatus', error, { id, status });
      return { data: null, error: error.message };
    }
    return { data, error: null };
  } catch (err) {
    reportSafe('updateOrderStatus unexpected', err);
    return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Merge operator-supplied notes into the `orders.tags` JSONB bag. The
 * schema doesn't have a dedicated `fulfillment_notes` column yet (that
 * lands in a later milestone), so notes ride along on the existing tags
 * object under the `notes` key — the storefront never reads tags so this
 * is operator-private metadata.
 *
 * Reads the current `tags` first to merge non-destructively (preserving
 * any other keys the operator might have placed there). Pass a
 * cookie-bound `client` from the route handler so RLS gates both the read
 * and the write and `auth.uid()` is recorded in the audit trail.
 */
export async function updateOrderNotes(
  id: string,
  notes: string,
  client?: AdminWriteClient
): Promise<{ data: OrderRow | null; error: string | null }> {
  try {
    const supabase = client ?? createAdminClient();

    const { data: existing, error: readErr } = await supabase
      .from('orders')
      .select('tags')
      .eq('id', id)
      .maybeSingle();

    if (readErr) {
      reportSafe('updateOrderNotes read', readErr, { id });
      return { data: null, error: readErr.message };
    }
    if (!existing) {
      return { data: null, error: 'Order not found' };
    }

    const currentTags =
      existing.tags && typeof existing.tags === 'object' && !Array.isArray(existing.tags)
        ? (existing.tags as Record<string, unknown>)
        : {};
    const nextTags = { ...currentTags, notes };

    const { data, error } = await supabase
      .from('orders')
      .update({ tags: nextTags as Json })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      reportSafe('updateOrderNotes write', error, { id });
      return { data: null, error: error.message };
    }
    return { data, error: null };
  } catch (err) {
    reportSafe('updateOrderNotes unexpected', err);
    return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// -----------------------------------------------------------------------------
// Customers namespace (consumed by Task 3)
// -----------------------------------------------------------------------------

export type AdminCustomerFilters = {
  search?: string;
  cohort?: string;
  limit?: number;
};

/** List customers for the admin grid. service-role: full directory access. */
export async function getAdminCustomers(
  filters: AdminCustomerFilters = {}
): Promise<{ data: CustomerRow[]; error: string | null }> {
  try {
    const supabase = createAdminClient();
    let query = supabase
      .from('customers')
      .select('*')
      .order('last_order_at', { ascending: false, nullsFirst: false })
      .limit(filters.limit ?? 200);

    if (filters.search) {
      const escaped = escapeIlike(filters.search);
      query = query.or(`email.ilike.%${escaped}%,name.ilike.%${escaped}%`);
    }
    // `cohort` filter is a placeholder until Task 3 lands the customer_cohorts
    // table; the column doesn't exist yet so we just no-op the filter.

    const { data, error } = await query;
    if (error) {
      reportSafe('getAdminCustomers', error);
      return { data: [], error: error.message };
    }
    return { data: data ?? [], error: null };
  } catch (err) {
    reportSafe('getAdminCustomers unexpected', err);
    return { data: [], error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/** Read a single customer by id. */
export async function getAdminCustomerById(
  id: string
): Promise<{ data: CustomerRow | null; error: string | null }> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) {
      reportSafe('getAdminCustomerById', error, { id });
      return { data: null, error: error.message };
    }
    return { data: data ?? null, error: null };
  } catch (err) {
    reportSafe('getAdminCustomerById unexpected', err);
    return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Read every order placed by a customer. Orders are joined by
 * `customer_email` (the orders table doesn't carry a customer FK; the
 * existing schema denormalizes the email as the linking key).
 */
export async function getCustomerOrderHistory(
  customerId: string
): Promise<{ data: OrderRow[]; error: string | null }> {
  try {
    const supabase = createAdminClient();

    // Resolve email from the customers row first; orders.customer_email is
    // the only column that ties an order back to a customer.
    const { data: customer, error: custErr } = await supabase
      .from('customers')
      .select('email')
      .eq('id', customerId)
      .maybeSingle();

    if (custErr) {
      reportSafe('getCustomerOrderHistory customer lookup', custErr, { customerId });
      return { data: [], error: custErr.message };
    }
    if (!customer?.email) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_email', customer.email)
      .order('created_at', { ascending: false });

    if (error) {
      reportSafe('getCustomerOrderHistory orders', error, { customerId });
      return { data: [], error: error.message };
    }
    return { data: data ?? [], error: null };
  } catch (err) {
    reportSafe('getCustomerOrderHistory unexpected', err);
    return { data: [], error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
