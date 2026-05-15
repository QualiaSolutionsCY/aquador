/**
 * Admin Products API — POST creates, PATCH updates, DELETE removes.
 *
 * All routes require an authenticated admin (verified server-side from the
 * Supabase session; never trust a client-supplied admin id — SEC rule:
 * "Always check auth server-side").
 *
 * Service-role mutations happen inside `admin-service.ts`; this route only
 * Zod-validates the body and calls into the deep module.
 */

import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import {
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/lib/supabase/admin-service';
import type { Database } from '@/lib/supabase/types';

export const maxDuration = 10;

const productCategoryEnum = z.enum([
  'men',
  'women',
  'niche',
  'essence-oil',
  'body-lotion',
  'lattafa-original',
  'al-haramain-originals',
  'victorias-secret-originals',
]);

const productTypeEnum = z.enum(['perfume', 'essence-oil', 'body-lotion']);
const productGenderEnum = z.enum(['men', 'women', 'unisex']);

const productBodySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().min(1, 'Description is required'),
  brand: z.string().max(120).nullable().optional(),
  category: productCategoryEnum,
  product_type: productTypeEnum,
  gender: productGenderEnum.nullable().optional(),
  size: z.string().min(1, 'Size is required').max(20),
  price: z.number().min(0, 'Price must be ≥ 0'),
  sale_price: z.number().min(0).nullable().optional(),
  image: z.string().url('Primary image must be a valid URL'),
  images: z.array(z.string().url('Each image must be a valid URL')).max(10),
  in_stock: z.boolean(),
  is_active: z.boolean(),
  tags: z.array(z.string().min(1).max(40)).max(20).nullable().optional(),
});

type ProductBody = z.infer<typeof productBodySchema>;

async function requireAdmin(request: NextRequest) {
  void request;
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
    .single();
  if (!adminUser) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }
  Sentry.setUser({ id: user.id, email: user.email });
  return { ok: true as const, userId: user.id };
}

function bodyToProductRow(body: ProductBody): Database['public']['Tables']['products']['Insert'] {
  return {
    name: body.name.trim(),
    description: body.description,
    brand: body.brand?.trim() || null,
    category: body.category,
    product_type: body.product_type,
    gender: body.gender ?? null,
    size: body.size.trim(),
    price: body.price,
    sale_price: body.sale_price ?? null,
    image: body.image.trim(),
    images: body.images.map((u) => u.trim()).filter(Boolean),
    in_stock: body.in_stock,
    is_active: body.is_active,
    tags: body.tags && body.tags.length > 0 ? body.tags.map((t) => t.trim()).filter(Boolean) : null,
  };
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const json = await request.json();
    const parsed = productBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid product data' },
        { status: 400 },
      );
    }

    const insert = bodyToProductRow(parsed.data);
    const { data, error } = await createProduct(insert);
    if (error || !data) {
      return NextResponse.json({ error: error ?? 'Failed to create product' }, { status: 500 });
    }
    return NextResponse.json({ product: data });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const json = await request.json();
    const parsed = productBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid product data' },
        { status: 400 },
      );
    }
    if (!parsed.data.id) {
      return NextResponse.json({ error: 'Missing product id' }, { status: 400 });
    }

    const update = bodyToProductRow(parsed.data);
    const { data, error } = await updateProduct(parsed.data.id, update);
    if (error || !data) {
      return NextResponse.json({ error: error ?? 'Failed to update product' }, { status: 500 });
    }
    return NextResponse.json({ product: data });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing product id' }, { status: 400 });
    }
    const { error } = await deleteProduct(id);
    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
