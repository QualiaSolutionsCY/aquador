/**
 * /api/admin/settings — operator-editable store settings.
 *
 * GET  → returns the singleton row in camelCase shape.
 * PUT  → validates with Zod, updates the singleton row, returns the
 *        updated record.
 *
 * Auth: middleware (src/middleware.ts) already gates `/api/admin/*` on
 * admin_users membership. We additionally verify admin status server-side
 * via a direct lookup so a misconfigured matcher cannot silently let a
 * non-admin through. We use the cookies-aware server client (NOT the
 * service-role admin client) — Supabase RLS evaluates `is_admin()` based
 * on the caller's session.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 10;

const SETTINGS_ID = 1;

const settingsUpdateSchema = z.object({
  contactEmail: z.string().max(320).optional(),
  contactPhone: z.string().max(64).optional(),
  instagramUrl: z.string().max(500).optional(),
  facebookUrl: z.string().max(500).optional(),
  shippingPolicySummary: z.string().max(4000).optional(),
  returnsPolicySummary: z.string().max(4000).optional(),
  freeShippingThresholdCents: z.number().int().min(0).max(1_000_000).optional(),
  stripePaymentEnabled: z.boolean().optional(),
  stripeApplePayEnabled: z.boolean().optional(),
  stripeGooglePayEnabled: z.boolean().optional(),
  seoDefaultTitle: z.string().max(200).optional(),
  seoDefaultDescription: z.string().max(500).optional(),
});

export type StoreSettingsShape = z.infer<typeof settingsUpdateSchema>;

interface StoreSettingsRow {
  id: number;
  contact_email: string;
  contact_phone: string;
  instagram_url: string;
  facebook_url: string;
  shipping_policy_summary: string;
  returns_policy_summary: string;
  free_shipping_threshold_cents: number;
  stripe_payment_enabled: boolean;
  stripe_apple_pay_enabled: boolean;
  stripe_google_pay_enabled: boolean;
  seo_default_title: string;
  seo_default_description: string;
  updated_at: string;
}

function rowToShape(row: StoreSettingsRow) {
  return {
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    instagramUrl: row.instagram_url,
    facebookUrl: row.facebook_url,
    shippingPolicySummary: row.shipping_policy_summary,
    returnsPolicySummary: row.returns_policy_summary,
    freeShippingThresholdCents: row.free_shipping_threshold_cents,
    stripePaymentEnabled: row.stripe_payment_enabled,
    stripeApplePayEnabled: row.stripe_apple_pay_enabled,
    stripeGooglePayEnabled: row.stripe_google_pay_enabled,
    seoDefaultTitle: row.seo_default_title,
    seoDefaultDescription: row.seo_default_description,
    updatedAt: row.updated_at,
  };
}

function shapeToRowPatch(shape: StoreSettingsShape) {
  const patch: Record<string, unknown> = {};
  if (shape.contactEmail !== undefined) patch.contact_email = shape.contactEmail;
  if (shape.contactPhone !== undefined) patch.contact_phone = shape.contactPhone;
  if (shape.instagramUrl !== undefined) patch.instagram_url = shape.instagramUrl;
  if (shape.facebookUrl !== undefined) patch.facebook_url = shape.facebookUrl;
  if (shape.shippingPolicySummary !== undefined)
    patch.shipping_policy_summary = shape.shippingPolicySummary;
  if (shape.returnsPolicySummary !== undefined)
    patch.returns_policy_summary = shape.returnsPolicySummary;
  if (shape.freeShippingThresholdCents !== undefined)
    patch.free_shipping_threshold_cents = shape.freeShippingThresholdCents;
  if (shape.stripePaymentEnabled !== undefined)
    patch.stripe_payment_enabled = shape.stripePaymentEnabled;
  if (shape.stripeApplePayEnabled !== undefined)
    patch.stripe_apple_pay_enabled = shape.stripeApplePayEnabled;
  if (shape.stripeGooglePayEnabled !== undefined)
    patch.stripe_google_pay_enabled = shape.stripeGooglePayEnabled;
  if (shape.seoDefaultTitle !== undefined) patch.seo_default_title = shape.seoDefaultTitle;
  if (shape.seoDefaultDescription !== undefined)
    patch.seo_default_description = shape.seoDefaultDescription;
  return patch;
}

async function assertAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401, error: 'Unauthorized' };

  // Mirror the middleware check explicitly so this route is defensible
  // even if the matcher is reconfigured. Public.is_admin() is also
  // evaluated by RLS on the row write, but the direct lookup gives a
  // clean 403 instead of an opaque permission-denied row error.
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
  return { ok: true as const };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const auth = await assertAdmin(supabase);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // store_settings is not yet in generated Database types — cast for now.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('store_settings')
      .select('*')
      .eq('id', SETTINGS_ID)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json(
        { error: 'store_settings singleton row missing — re-run migration' },
        { status: 500 },
      );
    }

    return NextResponse.json(rowToShape(data as StoreSettingsRow));
  } catch (err) {
    console.error('admin settings GET error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const auth = await assertAdmin(supabase);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json().catch(() => null);
    const parsed = settingsUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid settings payload' },
        { status: 400 },
      );
    }

    const patch = shapeToRowPatch(parsed.data);
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('store_settings')
      .update(patch)
      .eq('id', SETTINGS_ID)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(rowToShape(data as StoreSettingsRow));
  } catch (err) {
    console.error('admin settings PUT error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
