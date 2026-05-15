/**
 * Admin Orders Detail API — PATCH mutates a single order.
 *
 * Cookie-based auth via the server Supabase client (never service-role on the
 * caller path; SEC-04). Service-role mutations are delegated to
 * `admin-service.ts` (`updateOrderStatus`, `updateOrderNotes`).
 *
 * Accepted payload shape (one or both fields):
 *   { status?: OrderStatus, notes?: string }
 *
 * Zod enforces the enum membership of `status` against the schema's
 * `order_status` values. `notes` is stored on `orders.tags.notes` to avoid a
 * schema migration in this phase (Phase 3.3 deliberately keeps `orders.tags`
 * as the bag for operator-supplied metadata until the dedicated
 * `fulfillment_notes` column lands in M4).
 */

import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { updateOrderStatus, getAdminOrderById } from '@/lib/supabase/admin-service';

export const maxDuration = 10;

const orderStatusEnum = z.enum([
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
]);

const patchOrderSchema = z
  .object({
    status: orderStatusEnum.optional(),
    notes: z.string().max(2000).optional(),
  })
  .refine(
    (v) => v.status !== undefined || v.notes !== undefined,
    'Provide at least one of status or notes',
  );

async function requireAdmin() {
  const authSupabase = await createClient();
  const {
    data: { user },
  } = await authSupabase.auth.getUser();
  if (!user) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  const { data: adminUser } = await authSupabase
    .from('admin_users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();
  if (!adminUser) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }
  Sentry.setUser({ id: user.id, email: user.email });
  return { ok: true as const, userId: user.id };
}

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, ctx: RouteCtx) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const { id } = await ctx.params;
    if (!id) {
      return NextResponse.json({ error: 'Missing order id' }, { status: 400 });
    }

    const json = await request.json().catch(() => null);
    const parsed = patchOrderSchema.safeParse(json);
    if (!parsed.success) {
      Sentry.addBreadcrumb({
        category: 'admin-orders',
        message: 'PATCH validation failed',
        level: 'warning',
        data: { issue: parsed.error.issues[0]?.message, orderId: id },
      });
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid order patch' },
        { status: 400 },
      );
    }

    const { status, notes } = parsed.data;

    if (status !== undefined) {
      const { data, error } = await updateOrderStatus(id, status);
      if (error || !data) {
        Sentry.addBreadcrumb({
          category: 'admin-orders',
          message: 'updateOrderStatus failed',
          level: 'error',
          data: { orderId: id, status, error },
        });
        return NextResponse.json(
          { error: error ?? 'Failed to update status' },
          { status: 500 },
        );
      }
    }

    if (notes !== undefined) {
      // Notes are stored on orders.tags.notes — see file docstring.
      const { data: existing } = await getAdminOrderById(id);
      if (!existing) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      const currentTags =
        existing.tags && typeof existing.tags === 'object' && !Array.isArray(existing.tags)
          ? (existing.tags as Record<string, string>)
          : {};
      const nextTags = { ...currentTags, notes };
      const supabase = createAdminClient();
      const { error: noteErr } = await supabase
        .from('orders')
        .update({ tags: nextTags })
        .eq('id', id);
      if (noteErr) {
        Sentry.addBreadcrumb({
          category: 'admin-orders',
          message: 'updateOrderNotes failed',
          level: 'error',
          data: { orderId: id, error: noteErr.message },
        });
        return NextResponse.json({ error: noteErr.message }, { status: 500 });
      }
    }

    const { data: refreshed } = await getAdminOrderById(id);
    return NextResponse.json({ order: refreshed });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
