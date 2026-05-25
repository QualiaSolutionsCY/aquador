/**
 * /api/admin/customers/[id]/cohorts — admin cohort tagging endpoint
 * (Phase 3 Task 3, ADMIN-06).
 *
 * Auth: cookie-bound Supabase session (`createClient` from server.ts).
 * The viewer's `auth.uid()` is derived server-side and matched against
 * `public.admin_users` — we never accept a client-supplied admin id.
 * Mutations rely on RLS: the `customer_cohorts_admin_all` policy gates
 * writes through `public.is_admin()`, so even a forged request from a
 * non-admin session is rejected at the database layer.
 *
 * Endpoints:
 *   POST   { cohort: string }              → upsert (no-op on duplicate)
 *   DELETE ?cohort=... | { cohort: ... }   → remove
 *
 * Both return the full updated cohort list so the optimistic client
 * can reconcile its state with one round-trip.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const cohortSchema = z.object({
  cohort: z
    .string()
    .trim()
    .min(1, 'Cohort label is required')
    .max(32, 'Cohort label must be 32 characters or fewer')
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, digits, and hyphens only'),
});

async function assertAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401, error: 'Unauthorized' };

  const { data: adminRow, error: adminError } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (adminError) {
    return { ok: false as const, status: 500, error: adminError.message };
  }
  if (!adminRow) {
    return { ok: false as const, status: 403, error: 'Forbidden' };
  }
  return { ok: true as const, userId: user.id };
}

async function listCohorts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  customerId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from('customer_cohorts')
    .select('cohort, created_at')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return data.map((r) => r.cohort);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const auth = await assertAdmin(supabase);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const cohorts = await listCohorts(supabase, id);
    return NextResponse.json({ cohorts });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const auth = await assertAdmin(supabase);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json().catch(() => null);
    const parsed = cohortSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid cohort payload' },
        { status: 400 },
      );
    }

    const cohort = parsed.data.cohort;
    // Upsert with ON CONFLICT (customer_id, cohort) DO NOTHING — duplicate
    // adds become a no-op rather than throwing a unique-violation.
    const { error: insertError } = await supabase
      .from('customer_cohorts')
      .upsert(
        { customer_id: id, cohort, created_by: auth.userId },
        { onConflict: 'customer_id,cohort', ignoreDuplicates: true },
      );

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const cohorts = await listCohorts(supabase, id);
    return NextResponse.json({ ok: true, cohort, cohorts });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const auth = await assertAdmin(supabase);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Accept the cohort from either the query string or the JSON body.
    let raw: unknown = request.nextUrl.searchParams.get('cohort');
    if (!raw) {
      const body = await request.json().catch(() => null);
      raw = body && typeof body === 'object' ? (body as { cohort?: unknown }).cohort : null;
    }
    const parsed = cohortSchema.safeParse({ cohort: raw });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid cohort payload' },
        { status: 400 },
      );
    }

    const cohort = parsed.data.cohort;
    const { error: deleteError } = await supabase
      .from('customer_cohorts')
      .delete()
      .eq('customer_id', id)
      .eq('cohort', cohort);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    const cohorts = await listCohorts(supabase, id);
    return NextResponse.json({ ok: true, cohort, cohorts });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
