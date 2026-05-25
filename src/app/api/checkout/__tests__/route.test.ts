/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import Stripe from 'stripe';

// Mock dependencies before imports
const mockGetStripe = jest.fn();
const mockValidateCartPrices = jest.fn();
const mockCheckRateLimit = jest.fn();

// Mock Stripe
jest.mock('@/lib/stripe', () => ({
  getStripe: (...args: unknown[]) => mockGetStripe(...args),
}));

// Mock cart validation
jest.mock('@/lib/validation/cart', () => ({
  cartItemSchema: require('zod').z.object({
    productId: require('zod').z.string(),
    variantId: require('zod').z.string(),
    name: require('zod').z.string(),
    price: require('zod').z.number(),
    quantity: require('zod').z.number(),
    productType: require('zod').z.string().optional(),
    size: require('zod').z.string().optional(),
    image: require('zod').z.string().optional(),
  }),
  validateCartPrices: (...args: unknown[]) => mockValidateCartPrices(...args),
}));

// Mock rate limiter
jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
}));

// Mock Sentry
jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}));

// Mock currency functions
jest.mock('@/lib/currency', () => ({
  CURRENCY_CODE: 'eur',
  toCents: (amount: number) => Math.round(amount * 100),
}));

// Mock constants
jest.mock('@/lib/constants', () => ({
  getProductTypeLabel: (type: string) => type === 'perfume' ? 'Perfume' : 'Product',
  SHIPPING_COUNTRIES: ['CY', 'GR', 'UK'],
  FREE_SHIPPING_THRESHOLD: 35,
  DELIVERY_FEE: 3,
}));

// Store original env
const originalEnv = process.env;

beforeAll(() => {
  process.env = {
    ...originalEnv,
    STRIPE_SECRET_KEY: 'sk_test_123',
    NEXT_PUBLIC_APP_URL: 'https://aquadorcy.com',
  };
});

afterAll(() => {
  process.env = originalEnv;
});

// Import after all mocks
import { POST } from '../route';

describe('POST /api/checkout', () => {
  const createMockRequest = (body: unknown) => {
    return new NextRequest('https://aquadorcy.com/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  };

  const mockCheckoutSession: Stripe.Checkout.Session = {
    id: 'cs_test_checkout_session',
    object: 'checkout.session',
    url: 'https://checkout.stripe.com/pay/cs_test_checkout_session',
    amount_total: 5999,
    currency: 'eur',
    // Required Stripe fields
    livemode: false,
    status: 'open',
    payment_status: 'unpaid',
    mode: 'payment',
    customer_details: null,
    created: Math.floor(Date.now() / 1000),
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  } as unknown as Stripe.Checkout.Session;

  beforeEach(() => {
    jest.clearAllMocks();

    // Default: no rate limit
    mockCheckRateLimit.mockResolvedValue(null);

    // Default: prices are valid — correctedItems mirrors input
    mockValidateCartPrices.mockImplementation(async (items: unknown[]) => ({
      valid: true,
      errors: [],
      correctedItems: items,
    }));

    // Default: Stripe creates session successfully
    mockGetStripe.mockReturnValue({
      checkout: {
        sessions: {
          create: jest.fn().mockResolvedValue(mockCheckoutSession),
        },
      },
    });
  });

  describe('Happy Path', () => {
    it('should create Stripe session for valid cart checkout', async () => {
      const validCart = {
        items: [
          {
            productId: 'prod_1',
            variantId: 'var_1',
            name: 'Luxury Perfume',
            price: 59.99,
            quantity: 1,
            productType: 'perfume',
            size: '50ml',
            image: 'https://example.com/image.jpg',
          },
        ],
      };

      const request = createMockRequest(validCart);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.sessionId).toBe('cs_test_checkout_session');
      expect(data.url).toBe('https://checkout.stripe.com/pay/cs_test_checkout_session');
      expect(mockValidateCartPrices).toHaveBeenCalledWith(validCart.items);
    });

    it('should include correct line items in Stripe session', async () => {
      const mockCreate = jest.fn().mockResolvedValue(mockCheckoutSession);
      mockGetStripe.mockReturnValue({
        checkout: {
          sessions: {
            create: mockCreate,
          },
        },
      });

      const validCart = {
        items: [
          {
            productId: 'prod_1',
            variantId: 'var_1',
            name: 'Rose Perfume',
            price: 45.50,
            quantity: 2,
            productType: 'perfume',
            size: '100ml',
          },
        ],
      };

      const request = createMockRequest(validCart);
      await POST(request);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'payment',
          line_items: [
            {
              price_data: {
                currency: 'eur',
                product_data: {
                  name: 'Rose Perfume',
                  description: 'Perfume - 100ml',
                  images: undefined,
                },
                unit_amount: 4550,
              },
              quantity: 2,
            },
          ],
        })
      );
    });

    it('should require an ACS checkpoint in Stripe Checkout', async () => {
      const mockCreate = jest.fn().mockResolvedValue(mockCheckoutSession);
      mockGetStripe.mockReturnValue({
        checkout: {
          sessions: {
            create: mockCreate,
          },
        },
      });

      const request = createMockRequest({
        items: [
          {
            productId: 'prod_1',
            variantId: 'var_1',
            name: 'Test Perfume',
            price: 45,
            quantity: 1,
          },
        ],
      });
      await POST(request);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          custom_fields: [
            expect.objectContaining({
              key: 'acscheckpoint',
              type: 'dropdown',
              optional: false,
              dropdown: expect.objectContaining({
                options: expect.arrayContaining([
                  { label: 'Nicosia - Ay.Dometios', value: 'ACS001' },
                  { label: 'Limassol - Tsireio', value: 'ACS018' },
                  { label: 'Paphos - Paphos', value: 'ACS039' },
                ]),
              }),
            }),
          ],
        })
      );
    });

    it('should store minimal metadata for webhook reconstruction', async () => {
      const mockCreate = jest.fn().mockResolvedValue(mockCheckoutSession);
      mockGetStripe.mockReturnValue({
        checkout: {
          sessions: {
            create: mockCreate,
          },
        },
      });

      const validCart = {
        items: [
          {
            productId: 'prod_1',
            variantId: 'var_1',
            name: 'Test Perfume',
            price: 29.99,
            quantity: 1,
          },
        ],
      };

      const request = createMockRequest(validCart);
      await POST(request);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {
            itemCount: '1',
            items: JSON.stringify([{ pid: 'prod_1', vid: 'var_1', qty: 1 }]),
          },
        })
      );
    });

    it('should charge delivery fee for orders under €35', async () => {
      const mockCreate = jest.fn().mockResolvedValue(mockCheckoutSession);
      mockGetStripe.mockReturnValue({
        checkout: {
          sessions: {
            create: mockCreate,
          },
        },
      });

      const validCart = {
        items: [
          {
            productId: 'prod_1',
            variantId: 'var_1',
            name: 'Test',
            price: 29.99,
            quantity: 1,
          },
        ],
      };

      const request = createMockRequest(validCart);
      await POST(request);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          shipping_address_collection: {
            allowed_countries: ['CY', 'GR', 'UK'],
          },
          shipping_options: expect.arrayContaining([
            expect.objectContaining({
              shipping_rate_data: expect.objectContaining({
                display_name: 'Standard delivery',
                fixed_amount: { amount: 300, currency: 'eur' },
              }),
            }),
          ]),
        })
      );
    });

    it('should offer free shipping for orders at or above €35', async () => {
      const mockCreate = jest.fn().mockResolvedValue(mockCheckoutSession);
      mockGetStripe.mockReturnValue({
        checkout: {
          sessions: {
            create: mockCreate,
          },
        },
      });

      const validCart = {
        items: [
          {
            productId: 'prod_1',
            variantId: 'var_1',
            name: 'Luxury Perfume',
            price: 49.99,
            quantity: 1,
          },
        ],
      };

      const request = createMockRequest(validCart);
      await POST(request);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          shipping_options: expect.arrayContaining([
            expect.objectContaining({
              shipping_rate_data: expect.objectContaining({
                display_name: 'Free shipping',
                fixed_amount: { amount: 0, currency: 'eur' },
              }),
            }),
          ]),
        })
      );
    });
  });

  describe('Validation', () => {
    it('should return 400 for empty cart', async () => {
      const request = createMockRequest({ items: [] });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Cart is empty');
    });

    it('should return 400 for missing items field', async () => {
      const request = createMockRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should return 400 when price validation fails', async () => {
      mockValidateCartPrices.mockResolvedValue({
        valid: false,
        errors: [{ productId: 'prod_1', expectedPrice: 59.99, receivedPrice: 49.99 }],
      });

      const validCart = {
        items: [
          {
            productId: 'prod_1',
            variantId: 'var_1',
            name: 'Test',
            price: 49.99, // Client sent wrong price
            quantity: 1,
          },
        ],
      };

      const request = createMockRequest(validCart);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid cart items');
      expect(data.details).toHaveLength(1);
    });
  });

  describe('Rate Limiting', () => {
    it('should return rate limit response if limit exceeded', async () => {
      const rateLimitResponse = new Response(
        JSON.stringify({ error: 'Too many requests' }),
        { status: 429 }
      );
      mockCheckRateLimit.mockResolvedValue(rateLimitResponse);

      const request = createMockRequest({
        items: [{ productId: 'prod_1', variantId: 'var_1', name: 'Test', price: 29.99, quantity: 1 }],
      });

      const response = await POST(request);
      expect(response.status).toBe(429);
    });
  });

  describe('Stripe Errors', () => {
    it('should return 500 when Stripe session creation fails', async () => {
      mockGetStripe.mockReturnValue({
        checkout: {
          sessions: {
            create: jest.fn().mockRejectedValue(new Error('Stripe API error')),
          },
        },
      });

      const validCart = {
        items: [
          {
            productId: 'prod_1',
            variantId: 'var_1',
            name: 'Test',
            price: 29.99,
            quantity: 1,
          },
        ],
      };

      const request = createMockRequest(validCart);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Failed to create checkout session');
    });
  });
});
