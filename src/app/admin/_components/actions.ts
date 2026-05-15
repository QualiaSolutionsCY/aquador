'use server';

/**
 * /admin server actions.
 *
 * Today this module exposes one action: `getTopProductsAction`. It is the
 * thin server-action bridge between the client `TopProductsWidget`
 * (period tab toggle) and `admin-service.getTopProducts`. Living in its
 * own file keeps the page-level server component free of mixed boundaries
 * and lets the client widget call the action with a normal `await`.
 *
 * Why a server action (vs an API route): the widget is rendered inside
 * `/admin` which is already auth-gated by `src/middleware.ts`; the action
 * inherits the same session cookies and reuses the server-only
 * `admin-service` module without a network round-trip through a JSON
 * envelope. We do NOT expose this action to public routes — Next.js
 * binds the action by reference to the consuming client component, so
 * unauthenticated callers cannot invoke it without first passing
 * middleware.
 */

import { getTopProducts, type Period, type TopProductRow } from '@/lib/supabase/admin-service';

export async function getTopProductsAction(
  period: Period,
  limit = 5,
): Promise<TopProductRow[]> {
  return getTopProducts(period, limit);
}
