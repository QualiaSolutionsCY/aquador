import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/public';
import { checkRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

export const maxDuration = 10;

const heartbeatSchema = z.object({
  sessionId: z.string().min(1).max(128),
  page: z.string().max(512).optional(),
});

export async function POST(request: NextRequest) {
  const rateLimitResponse = await checkRateLimit(request, 'heartbeat');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const result = heartbeatSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
    }
    const { sessionId, page } = result.data;

    // SEC-02: use anon client (no service-role). Stale-row cleanup is now
    // handled by pg_cron — see supabase/migrations/20260515000000_heartbeat_pg_cron_cleanup.sql
    const supabase = createPublicClient();

    // Hash the IP for privacy. HEARTBEAT_SALT must be set in production —
    // a static fallback would let anyone reconstruct visitor IPs from a table dump.
    const salt = process.env.HEARTBEAT_SALT;
    if (!salt) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Heartbeat misconfigured' }, { status: 503 });
      }
    }
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
    const encoder = new TextEncoder();
    const data = encoder.encode(ip + (salt || 'dev-only-salt'));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const ipHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const userAgent = request.headers.get('user-agent')?.slice(0, 256) || null;
    const country = request.headers.get('x-vercel-ip-country') || null;

    // SEC-02 + gap-D: pure INSERT (anon role has no UPDATE on site_visitors).
    // Multiple inserts per session are benign churn — pg_cron sweeps every 5m.
    await supabase.from('site_visitors').insert({
      session_id: sessionId,
      page: page || null,
      user_agent: userAgent,
      country,
      ip_hash: ipHash,
      last_seen: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Heartbeat error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
