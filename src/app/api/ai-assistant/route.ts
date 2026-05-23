/**
 * Aquad'or AI Concierge route.
 *
 * Streaming: returns Server-Sent Events framed as `data: {"token":"..."}\n\n`,
 * terminated by `data: [DONE]\n\n`. Streaming can be disabled by setting the
 * env var AI_STREAMING_ENABLED=false, in which case the route falls back to a
 * single JSON body (used only if OpenRouter streaming integration breaks for
 * the configured model). The fallback decision is logged with console.warn.
 *
 * Voice rules (DESIGN.md section 10b) apply to this file too: no em-dashes,
 * no en-dashes, no exclamation marks, no emoji in source text. The system
 * prompt enforces the same rules on the model output.
 */

import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';
import { formatApiError, getRequestId, createLogEntry } from '@/lib/api-utils';
import { checkRateLimit } from '@/lib/rate-limit';
import { catalogueProducts, type CatalogueProduct } from '@/lib/ai/catalogue-data';

export const maxDuration = 30;

// OpenRouter API (supports OpenAI, Anthropic, Google, and many other models)
const API_KEY = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
const API_ENDPOINT = process.env.AI_API_ENDPOINT || 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = process.env.AI_MODEL || 'anthropic/claude-sonnet-4.6';
const STREAMING_ENABLED = process.env.AI_STREAMING_ENABLED !== 'false';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const messageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().min(1).max(2000),
});

const cartItemSchema = z.object({
  name: z.string().min(1).max(200),
  quantity: z.number().int().nonnegative(),
  price_cents: z.number().int().nonnegative(),
});

const cartContextSchema = z.object({
  cartSummary: z.array(cartItemSchema).max(50),
}).optional();

const aiAssistantSchema = z.object({
  messages: z.array(messageSchema).min(1).optional(),
  query: z.string().min(1).max(2000).optional(),
  cartContext: cartContextSchema,
}).refine(data => data.messages || data.query, {
  message: 'Messages or query required',
});

/**
 * Persona block. Cache-stable. Editorial concierge voice; bans punctuation
 * and emoji that violate DESIGN.md section 10b in model output.
 */
const PERSONA_BLOCK = `You are a perfumer at the Aquad'or desk. Write short, concise answers by default. Use one sentence and two or three one-line bullets unless the shopper asks for detail. No long introductions, no essays, no repeated caveats. You do not use em-dashes, hyphens as punctuation, exclamation marks, or emoji. You address the shopper directly and you always end with one or two named picks linked in Markdown as [Name](/products/slug). You source picks only from the catalogue provided below.`;

/**
 * Build the catalogue block once at module load. The catalogue array is
 * READ-ONLY and lives in src/lib/ai/catalogue-data.ts. We serialize it here
 * into a compact one-line-per-product format. The slug is derived from the
 * product name using kebab-case so the model can produce [Name](/products/slug)
 * links without inventing identifiers.
 */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function serializeCatalogue(products: readonly CatalogueProduct[]): string {
  const lines = products.map((p) => {
    const slug = toSlug(p.name);
    const typeTag =
      p.type === 'essence-oil'
        ? ' [essence oil]'
        : p.type === 'body-lotion'
          ? ' [body lotion]'
          : '';
    return `- ${p.name} by ${p.brand} (${p.gender}, #${p.number})${typeTag} slug=${slug}`;
  });
  return lines.join('\n');
}

const CATALOGUE_BLOCK = `Catalogue (${catalogueProducts.length} products). Use only these names and slugs in links.\n${serializeCatalogue(catalogueProducts)}`;

/**
 * Cart block. Dynamic per request. Periods and commas only.
 */
function buildCartBlock(
  cartContext: z.infer<typeof cartContextSchema>,
): string {
  if (!cartContext || !cartContext.cartSummary || cartContext.cartSummary.length === 0) {
    return '';
  }
  const items = cartContext.cartSummary
    .map((item) => `${item.quantity} × ${item.name} (€${(item.price_cents / 100).toFixed(2)})`)
    .join(', ');
  return `The shopper currently has in their cart: ${items}.`;
}

function buildSystemPrompt(cartContext: z.infer<typeof cartContextSchema>): string {
  const cartBlock = buildCartBlock(cartContext);
  return cartBlock
    ? `${PERSONA_BLOCK}\n\n${CATALOGUE_BLOCK}\n\n${cartBlock}`
    : `${PERSONA_BLOCK}\n\n${CATALOGUE_BLOCK}`;
}

/**
 * Transform OpenRouter SSE frames into Aquad'or frames.
 *
 * OpenRouter sends lines like:
 *   data: {"id":"...","choices":[{"delta":{"content":"hello"}}]}
 *   data: [DONE]
 *
 * We rewrite each delta as `data: {"token":"..."}\n\n` and forward the
 * terminator as `data: [DONE]\n\n`.
 */
function transformOpenRouterStream(upstream: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.getReader();
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let newlineIndex = buffer.indexOf('\n');
          while (newlineIndex !== -1) {
            const rawLine = buffer.slice(0, newlineIndex).replace(/\r$/, '');
            buffer = buffer.slice(newlineIndex + 1);
            newlineIndex = buffer.indexOf('\n');

            if (!rawLine || rawLine.startsWith(':')) continue;
            if (!rawLine.startsWith('data:')) continue;

            const payload = rawLine.slice(5).trim();
            if (payload === '[DONE]') {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              continue;
            }

            try {
              const parsed = JSON.parse(payload) as {
                choices?: Array<{ delta?: { content?: string } }>;
              };
              const token = parsed.choices?.[0]?.delta?.content;
              if (typeof token === 'string' && token.length > 0) {
                const frame = `data: ${JSON.stringify({ token })}\n\n`;
                controller.enqueue(encoder.encode(frame));
              }
            } catch {
              // Swallow malformed frames. Upstream sometimes emits keepalive
              // comments that look like data lines.
            }
          }
        }
        controller.close();
      } catch (err) {
        Sentry.captureException(err);
        controller.error(err);
      } finally {
        reader.releaseLock();
      }
    },
  });
}

export async function POST(request: NextRequest) {
  // Rate-limit BEFORE initiating any upstream call or stream.
  const rateLimitResponse = await checkRateLimit(request, 'ai-assistant');
  if (rateLimitResponse) {
    return new Response('Too Many Requests', {
      status: 429,
      headers: rateLimitResponse.headers,
    });
  }

  const requestId = getRequestId(request);

  if (!API_KEY) {
    Sentry.captureMessage('AI API key not configured', { level: 'error' });
    return NextResponse.json(
      { error: 'AI concierge is not configured' },
      { status: 503 },
    );
  }

  try {

    const body = await request.json();
    const result = aiAssistantSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || 'Invalid request' },
        { status: 400 },
      );
    }
    const { messages, query, cartContext } = result.data;

    const conversationMessages: Message[] = messages || [
      { role: 'user', content: query! },
    ];

    const systemPrompt = buildSystemPrompt(cartContext);
    const fullMessages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...conversationMessages,
    ];

    Sentry.addBreadcrumb({
      category: 'ai-assistant',
      message: 'concierge.request',
      level: 'info',
      data: {
        requestId,
        model: MODEL,
        streaming: STREAMING_ENABLED,
        turns: conversationMessages.length,
        cartItems: cartContext?.cartSummary?.length ?? 0,
      },
    });

    if (!STREAMING_ENABLED) {
      console.warn(createLogEntry(request, 'ai-assistant.fallback.non-streaming', {
        reason: 'AI_STREAMING_ENABLED=false',
      }));

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://aquadorcy.com',
          'X-Title': "Aquad'or Fragrance Assistant",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: fullMessages,
          max_tokens: 180,
          temperature: 0.45,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        Sentry.captureMessage(`OpenRouter API error: ${response.status}`, {
          level: 'error',
          extra: { errorText, requestId },
        });
        throw new Error(`AI API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const assistantMessage = data.choices?.[0]?.message?.content;
      if (!assistantMessage) {
        throw new Error('No response from AI');
      }

      return NextResponse.json({
        message: assistantMessage,
        conversationId: data.id,
      });
    }

    const upstream = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://aquadorcy.com',
        'X-Title': "Aquad'or Fragrance Assistant",
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: fullMessages,
        max_tokens: 180,
        temperature: 0.45,
        stream: true,
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const errorText = upstream.body ? await upstream.text() : 'no upstream body';
      Sentry.captureMessage(`OpenRouter API error: ${upstream.status}`, {
        level: 'error',
        extra: { errorText, requestId },
      });
      throw new Error(`AI API error (${upstream.status}): ${errorText}`);
    }

    const transformed = transformOpenRouterStream(upstream.body);

    return new Response(transformed, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        'X-Request-Id': requestId,
      },
    });
  } catch (error) {
    Sentry.captureException(error);
    console.warn(createLogEntry(request, 'ai-assistant.error', {
      message: error instanceof Error ? error.message : 'unknown',
    }));
    const errorResponse = formatApiError(error, 'Failed to get AI response');
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
