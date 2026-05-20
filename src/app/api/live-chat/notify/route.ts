import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { checkRateLimit } from '@/lib/rate-limit';
import { createPublicClient } from '@/lib/supabase/public';

export const maxDuration = 10;

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_NOTIFY_TO = process.env.WHATSAPP_NOTIFY_TO;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://aquadorcy.com';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const CONTACT_EMAIL_TO = 'info@aquadorcy.com';

async function sendWhatsApp(sessionId: string): Promise<boolean> {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_NOTIFY_TO) {
    return false;
  }

  const chatLink = `${APP_URL}/admin/live-chat`;
  const message = `New Live Chat\n\nA customer is waiting to chat on Aquad'or.\n\nOpen: ${chatLink}\n\nSession: ${sessionId.slice(0, 8)}`;

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: WHATSAPP_NOTIFY_TO,
        type: 'text',
        text: { body: message },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    Sentry.captureMessage('WhatsApp notification failed', {
      level: 'warning',
      extra: { status: res.status, error: err },
    });
    return false;
  }

  return true;
}

async function sendEmailNotification(sessionId: string): Promise<boolean> {
  if (!RESEND_API_KEY) return false;

  const chatLink = `${APP_URL}/admin/live-chat`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Aquad'or Live Chat <noreply@aquadorcy.com>",
      to: [CONTACT_EMAIL_TO],
      subject: 'New Live Chat — Customer Waiting',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #D4AF37;">New Live Chat Request</h2>
          <p>A customer is waiting to chat with you on Aquad'or.</p>
          <a href="${chatLink}" style="display: inline-block; background: #D4AF37; color: #000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px; margin: 16px 0;">
            Open Live Chat
          </a>
          <p style="color: #999; font-size: 12px;">Session: ${sessionId.slice(0, 8)}</p>
        </div>
      `,
    }),
  });

  return res.ok;
}

export async function POST(request: NextRequest) {
  // Rate limit: 3 requests per minute
  const rateLimitResponse = await checkRateLimit(request, 'live-chat-notify');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { sessionId } = await request.json();

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
    }

    // Validate session exists and is in 'waiting' state
    const supabase = createPublicClient();
    const { data: session } = await supabase
      .from('live_chat_sessions')
      .select('id, status')
      .eq('id', sessionId)
      .eq('status', 'waiting')
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
    }

    const [whatsappSent, emailSent] = await Promise.all([
      sendWhatsApp(sessionId),
      sendEmailNotification(sessionId),
    ]);

    return NextResponse.json({ ok: true, whatsappSent, emailSent });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Notification failed' }, { status: 500 });
  }
}
