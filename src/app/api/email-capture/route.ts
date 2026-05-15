import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createPublicClient } from '@/lib/supabase/public';
import { createLogEntry, getRequestId } from '@/lib/api-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const emailCaptureSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
});

const ROUTE = 'email-capture';

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    console.log(createLogEntry(request, 'invalid_json', { route: ROUTE, status: 400 }));
    return NextResponse.json(
      { ok: false, error: 'invalid_email' },
      { status: 400 }
    );
  }

  const parsed = emailCaptureSchema.safeParse(body);
  if (!parsed.success) {
    console.log(createLogEntry(request, 'validation_failed', { route: ROUTE, status: 400 }));
    return NextResponse.json(
      { ok: false, error: 'invalid_email' },
      { status: 400 }
    );
  }

  const email = parsed.data.email;
  const supabase = createPublicClient();

  // The `subscribers` table is defined in migration 20260514120000 but is not
  // yet present in the generated Database types. Cast `.from` to bypass the
  // table-name literal check until types are regenerated.
  const { error } = await (supabase as unknown as {
    from: (table: string) => {
      insert: (row: { email: string; source: string }) => Promise<{
        error: { code?: string; message?: string } | null;
      }>;
    };
  })
    .from('subscribers')
    .insert({ email, source: 'homepage' });

  if (error) {
    if (error.code === '23505') {
      console.log(
        createLogEntry(request, 'already_subscribed', {
          route: ROUTE,
          status: 200,
        })
      );
      return NextResponse.json(
        { ok: true, status: 'already_subscribed' },
        { status: 200 }
      );
    }

    console.log(
      createLogEntry(request, 'storage_failed', {
        route: ROUTE,
        status: 500,
        requestId,
        errorCode: error.code,
        errorMessage: error.message,
      })
    );
    return NextResponse.json(
      { ok: false, error: 'storage_failed' },
      { status: 500 }
    );
  }

  console.log(createLogEntry(request, 'subscribed', { route: ROUTE, status: 200 }));
  return NextResponse.json(
    { ok: true, status: 'subscribed' },
    { status: 200 }
  );
}
