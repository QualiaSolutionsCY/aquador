import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { createAdminClient } from '@/lib/supabase/admin';

export const maxDuration = 10;

const requestSchema = z.object({
  visitorId: z.string().trim().min(1).max(128),
});

export async function POST(request: NextRequest) {
  const rateLimitResponse = await checkRateLimit(request, 'live-chat-notify');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json().catch(() => null);
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'visitorId required' },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();
    const { data: session, error: sessionError } = await supabase
      .from('live_chat_sessions')
      .insert({
        visitor_id: parsed.data.visitorId,
        visitor_name: null,
        status: 'waiting',
      })
      .select('id, visitor_id, status')
      .single();

    if (sessionError) {
      return NextResponse.json({ error: sessionError.message }, { status: 500 });
    }

    const { error: messageError } = await supabase
      .from('live_chat_messages')
      .insert({
        session_id: session.id,
        sender_type: 'system',
        content: 'A visitor requested a live agent from the AI desk.',
      });

    if (messageError) {
      Sentry.captureMessage('live chat session created without system message', {
        level: 'warning',
        extra: { sessionId: session.id, error: messageError.message },
      });
    }

    return NextResponse.json({
      id: session.id,
      visitorId: session.visitor_id,
      status: session.status,
    });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Could not start live chat' }, { status: 500 });
  }
}
