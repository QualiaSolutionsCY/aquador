import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { formatApiError } from '@/lib/api-utils';
import { checkRateLimit } from '@/lib/rate-limit';
import { getStripe } from '@/lib/stripe';
import { getProductsByIds } from '@/lib/supabase/product-service';
import { formatAcsCheckpoint } from '@/lib/acs-checkpoints';

export const maxDuration = 10;

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  size?: string;
  composition?: {
    top: string;
    heart: string;
    base: string;
  };
}

interface CompactCustomPerfume {
  vid: string;
  n: string;
  t: string;
  h: string;
  b: string;
  s?: string;
  v: string;
}

interface SessionDetailsResponse {
  sessionId: string;
  orderNumber: string;
  items: OrderItem[];
  total: number;
  shipping: number;
  currency: string;
  shippingAddress?: {
    name?: string;
    acs_checkpoint?: string;
    acs_checkpoint_code?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      postal_code?: string;
      country?: string;
    };
  } | null;
  createdAt: number;
}

function readCheckoutCustomField(
  session: Awaited<ReturnType<ReturnType<typeof getStripe>['checkout']['sessions']['retrieve']>>,
  key: string
): string | null {
  const field = session.custom_fields?.find((customField) => customField.key === key);
  if (!field) return null;
  if (field.type === 'dropdown') return field.dropdown?.value ?? null;
  if (field.type === 'numeric') return field.numeric?.value ?? null;
  if (field.type === 'text') return field.text?.value ?? null;
  return null;
}

export async function GET(request: NextRequest) {
  // Check rate limit
  const rateLimitResponse = await checkRateLimit(request, 'checkout');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing session_id parameter' },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    // Retrieve session with expanded line_items
    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['line_items'],
      });
    } catch (error) {
      // Session not found or invalid
      Sentry.captureException(error, {
        tags: { action: 'retrieve_session' },
        extra: { sessionId },
      });
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // SECURITY: Only return data for completed sessions
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Session payment not completed' },
        { status: 403 }
      );
    }

    // Parse items from metadata
    const metadata = session.metadata || {};
    const items: OrderItem[] = [];
    const customPerfumesByVariant = new Map<string, CompactCustomPerfume>();
    for (const [key, value] of Object.entries(metadata)) {
      if (!key.startsWith('custom_') || !value) continue;
      try {
        const custom = JSON.parse(value) as CompactCustomPerfume;
        if (custom.vid) customPerfumesByVariant.set(custom.vid, custom);
      } catch (parseError) {
        Sentry.captureException(parseError, {
          tags: { action: 'parse_custom_perfume_metadata' },
          extra: { sessionId, key },
        });
      }
    }

    if (metadata.items) {
      // Standard cart checkout — parse shortened metadata (pid, vid, qty)
      // Reconstruct full item details from product catalog
      try {
        const shortItems = JSON.parse(metadata.items) as Array<{
          pid: string;
          vid: string;
          qty: number;
        }>;

        const productIds = shortItems.map(si => si.pid);
        const products = await getProductsByIds(productIds);
        const productMap = new Map(products.map(p => [p.id, p]));

        for (const shortItem of shortItems) {
          if (shortItem.pid === 'custom-perfume') {
            const custom = customPerfumesByVariant.get(shortItem.vid);
            const volume = custom?.v || (shortItem.vid.split('-').pop() || '50ml');
            items.push({
              name: custom?.n ? `${custom.n} Custom Perfume` : `Custom Perfume (${volume})`,
              quantity: shortItem.qty,
              price: volume === '100ml' ? 49.99 : 29.99,
              size: volume,
              composition: custom ? {
                top: custom.t,
                heart: custom.h,
                base: custom.b,
              } : undefined,
            });
            continue;
          }

          const product = productMap.get(shortItem.pid);
          if (product) {
            items.push({
              name: product.name,
              quantity: shortItem.qty,
              price: product.sale_price || product.price,
              size: product.size,
            });
          }
        }
      } catch (parseError) {
        Sentry.captureException(parseError, {
          tags: { action: 'parse_cart_items' },
          extra: { sessionId },
        });
        Sentry.addBreadcrumb({
          category: 'checkout-session',
          message: 'Failed to parse cart items metadata',
          level: 'error',
          data: { error: parseError }
        });
      }
    } else if (metadata.productType === 'custom-perfume') {
      // Custom perfume checkout — build item from metadata fields
      const volume = metadata.volume || '50ml';
      const price = volume === '100ml' ? 49.99 : 29.99;

      items.push({
        name: `Custom Perfume: ${metadata.perfumeName || 'Unnamed'}`,
        quantity: 1,
        price,
        size: volume,
        composition: {
          top: metadata.topNote || 'Unknown',
          heart: metadata.heartNote || 'Unknown',
          base: metadata.baseNote || 'Unknown',
        },
      });
    }

    // Extract shipping address
    const shippingDetails = session.collected_information?.shipping_details;
    const acsCheckpointCode = readCheckoutCustomField(session, 'acscheckpoint');
    const acsCheckpoint = formatAcsCheckpoint(acsCheckpointCode);
    const shippingAddress = shippingDetails || acsCheckpoint
      ? {
          name: shippingDetails?.name ?? undefined,
          acs_checkpoint: acsCheckpoint ?? undefined,
          acs_checkpoint_code: acsCheckpointCode ?? undefined,
          address: shippingDetails?.address
            ? {
                line1: shippingDetails.address.line1 ?? undefined,
                line2: shippingDetails.address.line2 ?? undefined,
                city: shippingDetails.address.city ?? undefined,
                postal_code: shippingDetails.address.postal_code ?? undefined,
                country: shippingDetails.address.country ?? undefined,
              }
            : undefined,
        }
      : null;

    // Generate order number from session ID (last 8 chars uppercase)
    const orderNumber = session.id.slice(-8).toUpperCase();

    const response: SessionDetailsResponse = {
      sessionId: session.id,
      orderNumber: `#${orderNumber}`,
      items,
      total: session.amount_total || 0,
      shipping: session.total_details?.amount_shipping || 0,
      currency: session.currency || 'eur',
      shippingAddress,
      createdAt: session.created,
    };

    return NextResponse.json(response);
  } catch (error) {
    Sentry.captureException(error, {
      tags: { route: 'session-details' },
    });
    Sentry.addBreadcrumb({
      category: 'checkout-session',
      message: 'Session details error',
      level: 'error',
      data: { error }
    });

    const errorResponse = formatApiError(error, 'Failed to retrieve session details');
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
