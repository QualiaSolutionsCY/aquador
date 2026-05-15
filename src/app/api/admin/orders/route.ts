import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const maxDuration = 10;

const manualOrderSchema = z.object({
  customerEmail: z.string().email('Valid email required'),
  customerName: z.string().max(200).optional(),
  customerPhone: z.string().max(30).optional(),
  items: z.array(z.object({
    name: z.string().min(1),
    quantity: z.number().int().positive(),
    price: z.number().positive(),
    productType: z.string().optional(),
  })).min(1, 'At least one item required'),
  total: z.number().positive('Total must be positive'),
  notes: z.string().max(1000).optional(),
  shippingAddress: z.object({
    name: z.string().optional(),
    address: z.object({
      line1: z.string().optional(),
      line2: z.string().optional(),
      city: z.string().optional(),
      postal_code: z.string().optional(),
      country: z.string().optional(),
    }).optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const authSupabase = await createClient();
    const { data: { user } } = await authSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is an admin. maybeSingle so a non-admin returns clean 403 instead of 500.
    const { data: adminUser } = await authSupabase
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    Sentry.setUser({ id: user.id, email: user.email });

    const body = await request.json();
    const result = manualOrderSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || 'Invalid order data' },
        { status: 400 }
      );
    }
    const orderData = result.data;

    const supabase = createAdminClient();

    // Insert order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        stripe_session_id: null,
        order_source: 'manual',
        customer_email: orderData.customerEmail.trim().toLowerCase(),
        customer_name: orderData.customerName?.trim() || null,
        customer_phone: orderData.customerPhone?.trim() || null,
        items: JSON.parse(JSON.stringify(orderData.items || [])),
        total: Math.round(orderData.total * 100), // Store in cents
        currency: 'eur',
        status: 'confirmed' as const,
        shipping_address: orderData.shippingAddress
          ? JSON.parse(JSON.stringify(orderData.shippingAddress))
          : null,
        tags: orderData.notes ? { notes: orderData.notes } : {},
      })
      .select()
      .single();

    if (orderError) {
      Sentry.captureException(orderError);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    // Upsert customer
    const now = new Date().toISOString();
    const email = orderData.customerEmail.trim().toLowerCase();

    const { data: existing } = await supabase
      .from('customers')
      .select('id, total_orders, total_spent, shipping_addresses')
      .eq('email', email)
      .single();

    if (existing) {
      const addresses = (existing.shipping_addresses as unknown[]) || [];
      if (orderData.shippingAddress?.address) {
        const addrStr = JSON.stringify(orderData.shippingAddress);
        const alreadyStored = addresses.some(a => JSON.stringify(a) === addrStr);
        if (!alreadyStored) addresses.push(orderData.shippingAddress);
      }

      await supabase
        .from('customers')
        .update({
          name: orderData.customerName?.trim() || undefined,
          ...(orderData.customerPhone ? { phone: orderData.customerPhone.trim() } : {}),
          total_orders: existing.total_orders + 1,
          total_spent: existing.total_spent + Math.round(orderData.total * 100),
          last_order_at: now,
          shipping_addresses: JSON.parse(JSON.stringify(addresses)),
        })
        .eq('id', existing.id);
    } else {
      await supabase.from('customers').insert({
        email,
        name: orderData.customerName?.trim() || null,
        phone: orderData.customerPhone?.trim() || null,
        total_orders: 1,
        total_spent: Math.round(orderData.total * 100),
        first_order_at: now,
        last_order_at: now,
        shipping_addresses: orderData.shippingAddress
          ? JSON.parse(JSON.stringify([orderData.shippingAddress]))
          : [],
      });
    }

    return NextResponse.json({ order });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
