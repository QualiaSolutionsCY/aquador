import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';

export const maxDuration = 10;

const querySchema = z.object({
  sessionId: z.string().uuid(),
  visitorId: z.string().trim().min(1).max(128),
});

const messageSchema = querySchema.extend({
  content: z.string().trim().min(1).max(1200),
});

async function validateVisitorSession(sessionId: string, visitorId: string) {
  const supabase = createAdminClient();
  const { data: session, error } = await supabase
    .from('live_chat_sessions')
    .select('id, visitor_id, status')
    .eq('id', sessionId)
    .eq('visitor_id', visitorId)
    .in('status', ['waiting', 'active'])
    .maybeSingle();

  if (error) return { supabase, session: null, error: error.message };
  if (!session) return { supabase, session: null, error: 'Live chat session not found' };
  return { supabase, session, error: null };
}

export async function GET(request: NextRequest) {
  try {
    const parsed = querySchema.safeParse({
      sessionId: request.nextUrl.searchParams.get('sessionId'),
      visitorId: request.nextUrl.searchParams.get('visitorId'),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid live chat query' },
        { status: 400 },
      );
    }

    const { supabase, error } = await validateVisitorSession(
      parsed.data.sessionId,
      parsed.data.visitorId,
    );
    if (error) return NextResponse.json({ error }, { status: 404 });

    const { data, error: messageError } = await supabase
      .from('live_chat_messages')
      .select('id, session_id, sender_type, content, created_at')
      .eq('session_id', parsed.data.sessionId)
      .order('created_at', { ascending: true });

    if (messageError) {
      return NextResponse.json({ error: messageError.message }, { status: 500 });
    }

    return NextResponse.json({ messages: data ?? [] });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Could not load live chat messages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = messageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid live chat message' },
        { status: 400 },
      );
    }

    const { supabase, error } = await validateVisitorSession(
      parsed.data.sessionId,
      parsed.data.visitorId,
    );
    if (error) return NextResponse.json({ error }, { status: 404 });

    const { data, error: insertError } = await supabase
      .from('live_chat_messages')
      .insert({
        session_id: parsed.data.sessionId,
        sender_type: 'visitor',
        content: parsed.data.content,
      })
      .select('id, session_id, sender_type, content, created_at')
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ message: data });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Could not send live chat message' }, { status: 500 });
  }
}
