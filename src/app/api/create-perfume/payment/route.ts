import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';
import { formatApiError } from '@/lib/api-utils';
import { checkRateLimit } from '@/lib/rate-limit';
import { getStripe } from '@/lib/stripe';
import { SHIPPING_COUNTRIES } from '@/lib/constants';
import { calculatePriceCents } from '@/lib/perfume/pricing';
import { isAllowedCustomPerfumeNote } from '@/lib/perfume/notes';

export const maxDuration = 10;

const perfumePaymentSchema = z.object({
  perfumeName: z.string().min(1, 'Perfume name is required'),
  composition: z.object({
    top: z.string().min(1),
    heart: z.string().min(1),
    base: z.string().min(1),
  }),
  volume: z.enum(['50ml', '100ml']),
  specialRequests: z.string().max(500).optional(),
});

function validateCompositionNotes(composition: z.infer<typeof perfumePaymentSchema>['composition']) {
  if (!isAllowedCustomPerfumeNote('top', composition.top)) return 'Choose a valid top note';
  if (!isAllowedCustomPerfumeNote('heart', composition.heart)) return 'Choose a valid heart note';
  if (!isAllowedCustomPerfumeNote('base', composition.base)) return 'Choose a valid base note';
  return null;
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  // Check rate limit
  const rateLimitResponse = await checkRateLimit(request, 'payment');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const stripe = getStripe();
    const body = await request.json();
    const result = perfumePaymentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || 'Invalid perfume data' },
        { status: 400 }
      );
    }
    const { perfumeName, composition, volume, specialRequests } = result.data;
    const compositionError = validateCompositionNotes(composition);
    if (compositionError) {
      return NextResponse.json({ error: compositionError }, { status: 400 });
    }

    const amount = calculatePriceCents(volume);

    // Create Stripe Checkout Session (same as regular checkout)
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Custom Perfume: ${perfumeName}`,
              description: `${volume} - Top: ${composition.top}, Heart: ${composition.heart}, Base: ${composition.base}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${BASE_URL}/create-perfume/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/create-perfume`,
      shipping_address_collection: {
        allowed_countries: [...SHIPPING_COUNTRIES],
      },
      phone_number_collection: { enabled: true },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 0,
              currency: 'eur',
            },
            display_name: 'Free shipping',
            delivery_estimate: {
              minimum: {
                unit: 'business_day',
                value: 1,
              },
              maximum: {
                unit: 'business_day',
                value: 2,
              },
            },
          },
        },
      ],
      metadata: {
        productType: 'custom-perfume',
        perfumeName,
        topNote: composition.top,
        heartNote: composition.heart,
        baseNote: composition.base,
        volume,
        specialRequests: specialRequests || '',
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    Sentry.captureException(error);

    const errorResponse = formatApiError(error, 'Failed to create checkout session');

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
