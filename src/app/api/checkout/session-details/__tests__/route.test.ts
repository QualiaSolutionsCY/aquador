/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

const mockCheckRateLimit = jest.fn();
const mockRetrieveSession = jest.fn();

jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
}));

jest.mock('@/lib/stripe', () => ({
  getStripe: () => ({
    checkout: {
      sessions: {
        retrieve: mockRetrieveSession,
      },
    },
  }),
}));

jest.mock('@/lib/supabase/product-service', () => ({
  getProductsByIds: jest.fn().mockResolvedValue([]),
}));

jest.mock('@sentry/nextjs', () => ({
  addBreadcrumb: jest.fn(),
  captureException: jest.fn(),
}));

import { GET } from '../route';

describe('GET /api/checkout/session-details', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue(null);
    mockRetrieveSession.mockResolvedValue({
      id: 'cs_test_12345678',
      payment_status: 'paid',
      metadata: {
        productType: 'custom-perfume',
        perfumeName: 'Private Blend',
        volume: '100ml',
        topNote: 'Bergamot',
        heartNote: 'Jasmine',
        baseNote: 'Cedar',
      },
      amount_total: 4999,
      total_details: { amount_shipping: 0 },
      currency: 'eur',
      created: 1779700000,
      collected_information: {
        shipping_details: {
          name: 'Customer Name',
          address: {
            line1: '1 Secret Street',
            line2: 'Flat 2',
            city: 'Nicosia',
            postal_code: '1010',
            country: 'CY',
          },
        },
      },
      custom_fields: [
        {
          key: 'acscheckpoint',
          type: 'dropdown',
          dropdown: { value: 'ACS-123' },
        },
      ],
    });
  });

  it('returns order summary data without public PII fields', async () => {
    const request = new NextRequest(
      'https://aquadorcy.com/api/checkout/session-details?session_id=cs_test_12345678',
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(
      expect.objectContaining({
        orderNumber: '#12345678',
        total: 4999,
        shipping: 0,
        currency: 'eur',
        createdAt: 1779700000,
      }),
    );
    expect(data.items).toEqual([
      expect.objectContaining({
        name: 'Custom Perfume: Private Blend',
        price: 49.99,
        size: '100ml',
        composition: {
          top: 'Bergamot',
          heart: 'Jasmine',
          base: 'Cedar',
        },
      }),
    ]);
    expect(data).not.toHaveProperty('sessionId');
    expect(data).not.toHaveProperty('shippingAddress');
    expect(JSON.stringify(data)).not.toContain('Customer Name');
    expect(JSON.stringify(data)).not.toContain('Secret Street');
    expect(JSON.stringify(data)).not.toContain('ACS-123');
  });
});
