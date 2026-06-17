/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import Stripe from 'stripe';

// Mock dependencies before imports
const mockGetProductsByIds = jest.fn();
const mockSupabaseFrom = jest.fn();
const mockSupabaseSelect = jest.fn();
const mockSupabaseInsert = jest.fn();
const mockSupabaseUpdate = jest.fn();
const mockSupabaseUpsert = jest.fn();
const mockSupabaseEq = jest.fn();
const mockSupabaseSingle = jest.fn();
const mockFetch = jest.fn();
const mockConstructEvent = jest.fn();
const mockSessionsRetrieve = jest.fn();
const mockDecrementProductStock = jest.fn();

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: (...args: unknown[]) => mockConstructEvent(...args),
    },
    checkout: {
      sessions: {
        retrieve: (...args: unknown[]) => mockSessionsRetrieve(...args),
      },
    },
  }));
});

// Mock Supabase admin client
jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(() => ({
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
  })),
}));

// Mock product service
jest.mock('@/lib/supabase/product-service', () => ({
  getProductsByIds: (...args: unknown[]) => mockGetProductsByIds(...args),
}));

// Mock admin service — also avoids the `import 'server-only'` directive at the
// top of admin-service.ts, which would otherwise throw under jsdom/node jest.
jest.mock('@/lib/supabase/admin-service', () => ({
  decrementProductStock: (...args: unknown[]) => mockDecrementProductStock(...args),
}));

// Mock Sentry
jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
}));

// Mock fetchWithTimeout
jest.mock('@/lib/api-utils', () => ({
  fetchWithTimeout: (...args: unknown[]) => mockFetch(...args),
}));

// Mock getStripe
jest.mock('@/lib/stripe', () => ({
  getStripe: jest.fn(() => ({
    webhooks: {
      constructEvent: (...args: unknown[]) => mockConstructEvent(...args),
    },
    checkout: {
      sessions: {
        retrieve: (...args: unknown[]) => mockSessionsRetrieve(...args),
      },
    },
  })),
}));

// Store original env
const originalEnv = process.env;

beforeAll(() => {
  process.env = {
    ...originalEnv,
    STRIPE_SECRET_KEY: 'sk_test_123',
    STRIPE_WEBHOOK_SECRET: 'whsec_test_secret',
    RESEND_API_KEY: 're_test_key',
  };
});

afterAll(() => {
  process.env = originalEnv;
});

// Import after all mocks
import { POST } from '../route';

describe('Stripe Webhook Handler', () => {
  const createMockRequest = (body: string, signature = 'valid_signature') => {
    return new NextRequest('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature,
      },
      body,
    });
  };

  const mockCheckoutSession = {
    id: 'cs_test_123456789',
    object: 'checkout.session',
    amount_total: 5999, // €59.99
    currency: 'eur',
    customer_details: {
      email: 'customer@example.com',
      name: 'John Doe',
      phone: null,
      tax_exempt: 'none',
      tax_ids: null,
    },
    metadata: {
      items: JSON.stringify([
        { pid: 'prod_1', vid: 'var_1', qty: 2 },
      ]),
    },
    collected_information: {
      shipping_details: {
        name: 'John Doe',
        address: {
          line1: '123 Main St',
          line2: 'Apt 4B',
          city: 'Nicosia',
          postal_code: '1011',
          country: 'CY',
          state: null,
        },
        phone: null,
      },
    },
    custom_fields: [
      {
        key: 'acscheckpoint',
        label: { type: 'custom', custom: 'ACS checkpoint' },
        optional: false,
        type: 'dropdown',
        dropdown: {
          value: 'ACS001',
          options: [],
        },
        numeric: null,
        text: null,
      },
    ],
    // Required Stripe fields
    livemode: false,
    status: 'complete',
    url: null,
    payment_status: 'paid',
    mode: 'payment',
    created: Math.floor(Date.now() / 1000),
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  } as unknown as Stripe.Checkout.Session;

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockConstructEvent.mockReturnValue({
      id: 'evt_test',
      type: 'checkout.session.completed',
      data: { object: mockCheckoutSession },
    } as Stripe.Event);

    // Default: stripe.checkout.sessions.retrieve mirrors the event's session payload.
    // The source calls retrieve() to fetch phone_number_collection data not present
    // in the webhook envelope; for tests we just echo the session set by
    // mockConstructEvent.mockReturnValue's data.object.
    mockSessionsRetrieve.mockImplementation(async () => {
      const event = mockConstructEvent.mock.results[mockConstructEvent.mock.results.length - 1]?.value
        ?? { data: { object: mockCheckoutSession } };
      return event.data.object;
    });

    // Default Supabase chain
    mockSupabaseSelect.mockReturnThis();
    mockSupabaseInsert.mockReturnThis();
    mockSupabaseUpdate.mockReturnThis();
    mockSupabaseUpsert.mockReturnThis();
    mockSupabaseEq.mockReturnThis();
    mockSupabaseSingle.mockResolvedValue({ data: null, error: null });

    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'orders') {
        return {
          upsert: mockSupabaseUpsert.mockReturnValue({
            select: jest.fn().mockResolvedValue({
              data: [{ id: 'order_1', stripe_session_id: 'cs_test_123456789' }],
              error: null,
            }),
          }),
        };
      }
      if (table === 'customers') {
        return {
          // FK-adoption upsert (M4 P1 T2 / OPTIMIZE H16): the webhook now
          // upserts the customer BEFORE the orders insert so customer_id
          // lands on the order row on first write. Returns the customer
          // UUID via .select('id').single().
          upsert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'cust_default_mock' },
                error: null,
              }),
            }),
          }),
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
          insert: jest.fn().mockResolvedValue({ data: null, error: null }),
          update: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      }
      return {
        select: mockSupabaseSelect,
        insert: mockSupabaseInsert,
        update: mockSupabaseUpdate,
        upsert: mockSupabaseUpsert,
      };
    });

    mockGetProductsByIds.mockResolvedValue([
      {
        id: 'prod_1',
        name: 'Luxury Perfume',
        price: 29.99,
        sale_price: null,
        product_type: 'Perfume',
      },
    ]);

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'email_sent' }),
    });

    // Default: stock decrement succeeds.
    mockDecrementProductStock.mockResolvedValue(true);
  });

  describe('Signature Verification', () => {
    it('should return 400 for missing stripe-signature header', async () => {
      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing stripe-signature header');
    });

    it('should return 400 for invalid signature', async () => {
      mockConstructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const request = createMockRequest('{}', 'invalid_signature');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid signature');
    });
  });

  describe('Happy Path - Cart Checkout', () => {
    it('should process valid cart checkout successfully', async () => {
      const request = createMockRequest(JSON.stringify({}));
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(mockGetProductsByIds).toHaveBeenCalledWith(['prod_1']);
      expect(mockFetch).toHaveBeenCalledTimes(2); // Customer + store emails
    });

    it('should persist order to database with correct data', async () => {
      const request = createMockRequest(JSON.stringify({}));
      await POST(request);

      expect(mockSupabaseFrom).toHaveBeenCalledWith('orders');
      const upsertCall = mockSupabaseUpsert.mock.calls[0][0];
      expect(upsertCall).toMatchObject({
        stripe_session_id: 'cs_test_123456789',
        customer_email: 'customer@example.com',
        customer_name: 'John Doe',
        total: 5999,
        currency: 'eur',
        status: 'confirmed',
      });
      expect(upsertCall.shipping_address).toMatchObject({
        acs_checkpoint: 'Nicosia - Ay.Dometios - 9 Prigkipos Karolou, 2373 Ag. Dometios',
        acs_checkpoint_code: 'ACS001',
      });
      expect(upsertCall.tags['acs-checkpoint']).toBe('Nicosia - Ay.Dometios - 9 Prigkipos Karolou, 2373 Ag. Dometios');
      expect(upsertCall.items).toHaveLength(1);
      expect(upsertCall.items[0]).toMatchObject({
        name: 'Luxury Perfume',
        quantity: 2,
        price: 29.99,
      });
    });

    it('should send customer confirmation email with correct data', async () => {
      const request = createMockRequest(JSON.stringify({}));
      await POST(request);

      const emailCall = mockFetch.mock.calls.find(call =>
        call[1]?.body?.includes('Thank You for Your Order')
      );
      expect(emailCall).toBeDefined();
      expect(emailCall[0]).toBe('https://api.resend.com/emails');

      const emailBody = JSON.parse(emailCall[1].body);
      expect(emailBody.to).toEqual(['customer@example.com']);
      expect(emailBody.subject).toContain('Order Confirmation');
      expect(emailBody.html).toContain('Luxury Perfume');
      expect(emailBody.html).toContain('123 Main St');
    });

    it('should send store notification email', async () => {
      const request = createMockRequest(JSON.stringify({}));
      await POST(request);

      const storeEmail = mockFetch.mock.calls.find(call =>
        call[1]?.body?.includes('New Order Received')
      );
      expect(storeEmail).toBeDefined();

      const emailBody = JSON.parse(storeEmail[1].body);
      expect(emailBody.to).toEqual(['info@aquadorcy.com']);
      expect(emailBody.subject).toContain('New Order');
      expect(emailBody.html).toContain('customer@example.com');
    });
  });

  describe('Happy Path - Custom Perfume', () => {
    it('should process custom perfume checkout successfully', async () => {
      const customPerfumeSession: Stripe.Checkout.Session = {
        ...mockCheckoutSession,
        amount_total: 2999,
        metadata: {
          productType: 'custom-perfume',
          perfumeName: 'My Special Blend',
          topNote: 'Bergamot',
          heartNote: 'Rose',
          baseNote: 'Sandalwood',
          volume: '50ml',
          specialRequests: 'Extra strength please',
        },
      };

      mockConstructEvent.mockReturnValue({
        id: 'evt_custom',
        type: 'checkout.session.completed',
        data: { object: customPerfumeSession },
      } as Stripe.Event);

      const request = createMockRequest(JSON.stringify({}));
      const response = await POST(request);

      expect(response.status).toBe(200);
      const upsertCall = mockSupabaseUpsert.mock.calls[0][0];
      expect(upsertCall.items[0].name).toBe('Custom Perfume: My Special Blend');
      expect(upsertCall.items[0].productType).toBe('custom-perfume');
      expect(upsertCall.tags['custom-perfume']).toBe('true');
      expect(upsertCall.tags.composition).toContain('Bergamot');
      expect(upsertCall.tags['special-requests']).toBe('Extra strength please');
    });
  });

  describe('Idempotency - Duplicate Events', () => {
    it('should handle duplicate webhook events gracefully', async () => {
      // Re-used customers mock that satisfies BOTH the FK-adoption
      // upsert step and the downstream aggregate read/update.
      const customersMock = () => ({
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'cust_idempotency_test' },
              error: null,
            }),
          }),
        }),
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
        insert: jest.fn().mockResolvedValue({ data: null, error: null }),
        update: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      // First call - new order
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'orders') {
          return {
            upsert: jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue({
                data: [{ id: 'order_1' }],
                error: null,
              }),
            }),
          };
        }
        if (table === 'customers') {
          return customersMock();
        }
        return { select: mockSupabaseSelect, insert: mockSupabaseInsert, update: mockSupabaseUpdate };
      });

      const request1 = createMockRequest(JSON.stringify({}));
      await POST(request1);

      expect(mockFetch).toHaveBeenCalledTimes(2); // Emails sent

      // Second call - duplicate (ignoreDuplicates returns empty array)
      jest.clearAllMocks();
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'orders') {
          return {
            upsert: jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue({
                data: [], // Empty = duplicate blocked
                error: null,
              }),
            }),
          };
        }
        if (table === 'customers') {
          return customersMock();
        }
        return { select: mockSupabaseSelect, insert: mockSupabaseInsert, update: mockSupabaseUpdate };
      });

      const request2 = createMockRequest(JSON.stringify({}));
      const response2 = await POST(request2);

      expect(response2.status).toBe(200);
      expect(mockFetch).not.toHaveBeenCalled(); // No emails on duplicate
    });
  });

  describe('Stock Decrement on Paid Orders', () => {
    it('decrements once per standard cart line on a new order', async () => {
      const twoLineSession: Stripe.Checkout.Session = {
        ...mockCheckoutSession,
        metadata: {
          items: JSON.stringify([
            { pid: 'prod_1', vid: 'var_1', qty: 2 },
            { pid: 'prod_2', vid: 'var_2', qty: 3 },
          ]),
        },
      };

      mockConstructEvent.mockReturnValue({
        id: 'evt_two_line',
        type: 'checkout.session.completed',
        data: { object: twoLineSession },
      } as Stripe.Event);

      mockGetProductsByIds.mockResolvedValue([
        { id: 'prod_1', name: 'Perfume One', price: 29.99, sale_price: null, product_type: 'perfume' },
        { id: 'prod_2', name: 'Perfume Two', price: 35.0, sale_price: null, product_type: 'perfume' },
      ]);

      const request = createMockRequest(JSON.stringify({}));
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockDecrementProductStock).toHaveBeenCalledTimes(2);
      expect(mockDecrementProductStock).toHaveBeenCalledWith('prod_1', 2);
      expect(mockDecrementProductStock).toHaveBeenCalledWith('prod_2', 3);
    });

    it('does NOT decrement on a duplicate webhook (isNewOrder false)', async () => {
      // orders upsert returns empty array => duplicate => isNewOrder false.
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'orders') {
          return {
            upsert: jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        if (table === 'customers') {
          return {
            upsert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: { id: 'cust_dup' }, error: null }),
              }),
            }),
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
            insert: jest.fn().mockResolvedValue({ data: null, error: null }),
            update: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return { select: mockSupabaseSelect, insert: mockSupabaseInsert, update: mockSupabaseUpdate };
      });

      const request = createMockRequest(JSON.stringify({}));
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockDecrementProductStock).not.toHaveBeenCalled();
    });

    it('does NOT decrement for a custom-perfume line (no products row)', async () => {
      const customSession: Stripe.Checkout.Session = {
        ...mockCheckoutSession,
        metadata: {
          productType: 'custom-perfume',
          perfumeName: 'My Special Blend',
          topNote: 'Bergamot',
          heartNote: 'Rose',
          baseNote: 'Sandalwood',
          volume: '50ml',
        },
      };

      mockConstructEvent.mockReturnValue({
        id: 'evt_custom_stock',
        type: 'checkout.session.completed',
        data: { object: customSession },
      } as Stripe.Event);

      const request = createMockRequest(JSON.stringify({}));
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockDecrementProductStock).not.toHaveBeenCalled();
    });

    it('logs a possible oversell but still returns 200 when decrement fails', async () => {
      const Sentry = jest.requireMock('@sentry/nextjs');
      mockDecrementProductStock.mockResolvedValue(false);

      const request = createMockRequest(JSON.stringify({}));
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockDecrementProductStock).toHaveBeenCalledWith('prod_1', 2);
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        'Stock decrement failed — possible oversell',
        expect.objectContaining({ level: 'warning' }),
      );
    });
  });

  describe('Edge Cases - Malformed Metadata', () => {
    it('should handle invalid JSON in metadata.items gracefully', async () => {
      const brokenSession: Stripe.Checkout.Session = {
        ...mockCheckoutSession,
        metadata: {
          items: 'not valid json {',
        },
      };

      mockConstructEvent.mockReturnValue({
        id: 'evt_broken',
        type: 'checkout.session.completed',
        data: { object: brokenSession },
      } as Stripe.Event);

      const request = createMockRequest(JSON.stringify({}));
      const response = await POST(request);

      expect(response.status).toBe(200); // Still returns 200
      const upsertCall = mockSupabaseUpsert.mock.calls[0][0];
      expect(upsertCall.items).toEqual([]); // Empty items due to parse failure
    });

    it('should handle missing metadata gracefully', async () => {
      const noMetadataSession: Stripe.Checkout.Session = {
        ...mockCheckoutSession,
        metadata: {},
      };

      mockConstructEvent.mockReturnValue({
        id: 'evt_no_meta',
        type: 'checkout.session.completed',
        data: { object: noMetadataSession },
      } as Stripe.Event);

      const request = createMockRequest(JSON.stringify({}));
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockGetProductsByIds).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases - Missing Customer Email', () => {
    it('should handle missing customer email gracefully', async () => {
      const noEmailSession: Stripe.Checkout.Session = {
        ...mockCheckoutSession,
        customer_details: null,
      };

      mockConstructEvent.mockReturnValue({
        id: 'evt_no_email',
        type: 'checkout.session.completed',
        data: { object: noEmailSession },
      } as Stripe.Event);

      const request = createMockRequest(JSON.stringify({}));
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockFetch).not.toHaveBeenCalled(); // No emails sent
    });
  });

  describe('Email Sending Failures', () => {
    it('should complete successfully even if email sending fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Email service unavailable' }),
      });

      const request = createMockRequest(JSON.stringify({}));
      const response = await POST(request);

      expect(response.status).toBe(200); // Webhook still succeeds
      expect(response.json()).resolves.toEqual({ received: true });
    });

    it('should complete successfully if email fetch throws', async () => {
      mockFetch.mockRejectedValue(new Error('Network timeout'));

      const request = createMockRequest(JSON.stringify({}));
      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Product Lookup Failures', () => {
    it('should handle non-existent product IDs gracefully', async () => {
      mockGetProductsByIds.mockResolvedValue([]); // No products found

      const request = createMockRequest(JSON.stringify({}));
      const response = await POST(request);

      expect(response.status).toBe(200);
      const upsertCall = mockSupabaseUpsert.mock.calls[0][0];
      expect(upsertCall.items).toEqual([]); // Empty items array
    });

    it('should handle partial product lookup failures', async () => {
      const sessionWithMultipleProducts: Stripe.Checkout.Session = {
        ...mockCheckoutSession,
        metadata: {
          items: JSON.stringify([
            { pid: 'prod_exists', vid: 'var_1', qty: 1 },
            { pid: 'prod_missing', vid: 'var_2', qty: 2 },
          ]),
        },
      };

      mockConstructEvent.mockReturnValue({
        id: 'evt_partial',
        type: 'checkout.session.completed',
        data: { object: sessionWithMultipleProducts },
      } as Stripe.Event);

      mockGetProductsByIds.mockResolvedValue([
        { id: 'prod_exists', name: 'Found Product', price: 19.99, product_type: 'Perfume' },
      ]);

      const request = createMockRequest(JSON.stringify({}));
      const response = await POST(request);

      expect(response.status).toBe(200);
      const upsertCall = mockSupabaseUpsert.mock.calls[0][0];
      expect(upsertCall.items).toHaveLength(1); // Only found product
      expect(upsertCall.items[0].name).toBe('Found Product');
    });
  });

  describe('Database Write Failures', () => {
    it('should return 200 even if order insert fails', async () => {
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'orders') {
          return {
            upsert: jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database connection failed' },
              }),
            }),
          };
        }
        if (table === 'customers') {
          // FK-adoption upsert succeeds so the orders insert is the
          // failure under test (not blocked by an earlier customers
          // upsert glitch).
          return {
            upsert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'cust_for_failing_order_test' },
                  error: null,
                }),
              }),
            }),
            select: mockSupabaseSelect,
            insert: mockSupabaseInsert,
            update: mockSupabaseUpdate,
          };
        }
        return { select: mockSupabaseSelect, insert: mockSupabaseInsert, update: mockSupabaseUpdate };
      });

      const request = createMockRequest(JSON.stringify({}));
      const response = await POST(request);

      expect(response.status).toBe(200); // Webhook must return 200 to prevent retries
      expect(mockFetch).not.toHaveBeenCalled(); // No emails if order failed
    });

    it('should return 200 even if customer upsert fails', async () => {
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'orders') {
          return {
            upsert: jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue({
                data: [{ id: 'order_1' }],
                error: null,
              }),
            }),
          };
        }
        if (table === 'customers') {
          return {
            // Upsert (FK-adoption step) returns an error — webhook must
            // log and continue with customer_id=null.
            upsert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Customer upsert failed' },
                }),
              }),
            }),
            select: mockSupabaseSelect.mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Customer query failed' },
            }),
            insert: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Insert failed' },
            }),
          };
        }
        return { select: mockSupabaseSelect };
      });

      const request = createMockRequest(JSON.stringify({}));
      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Other Event Types', () => {
    it('should handle checkout.session.expired events', async () => {
      mockConstructEvent.mockReturnValue({
        id: 'evt_expired',
        type: 'checkout.session.expired',
        data: { object: mockCheckoutSession },
      } as Stripe.Event);

      const request = createMockRequest(JSON.stringify({}));
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockSupabaseFrom).not.toHaveBeenCalled(); // No DB operations
    });

    it('should handle payment_intent.payment_failed events', async () => {
      mockConstructEvent.mockReturnValue({
        id: 'evt_failed',
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_test_123',
            object: 'payment_intent',
          } as Stripe.PaymentIntent,
        },
      } as Stripe.Event);

      const request = createMockRequest(JSON.stringify({}));
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockSupabaseFrom).not.toHaveBeenCalled();
    });

    it('should handle unknown event types gracefully', async () => {
      mockConstructEvent.mockReturnValue({
        id: 'evt_unknown',
        type: 'customer.created',
        data: { object: {} },
      } as Stripe.Event);

      const request = createMockRequest(JSON.stringify({}));
      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Missing Configuration', () => {
    it('should return 500 if STRIPE_WEBHOOK_SECRET is not configured', async () => {
      const savedSecret = process.env.STRIPE_WEBHOOK_SECRET;
      delete process.env.STRIPE_WEBHOOK_SECRET;

      const request = createMockRequest(JSON.stringify({}));
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Webhook configuration error');

      process.env.STRIPE_WEBHOOK_SECRET = savedSecret;
    });
  });
});
