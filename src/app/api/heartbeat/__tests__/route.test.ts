/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

// Mock dependencies before imports
const mockCheckRateLimit = jest.fn();
const mockSupabaseFrom = jest.fn();
const mockSupabaseInsert = jest.fn();

// Mock rate limiter
jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
}));

// Mock Supabase public (anon) client — heartbeat now uses createPublicClient
// after SEC-02 removed the admin-client dependency. Stale-row cleanup is handled
// by pg_cron, so the route no longer calls .delete().lt(...).
jest.mock('@/lib/supabase/public', () => ({
  createPublicClient: jest.fn(() => ({
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
  })),
}));

// Store original env
const originalEnv = process.env;

beforeAll(() => {
  process.env = {
    ...originalEnv,
    HEARTBEAT_SALT: 'test_salt',
  };
});

afterAll(() => {
  process.env = originalEnv;
});

// Import after all mocks
import { POST } from '../route';

describe('POST /api/heartbeat', () => {
  const createMockRequest = (body: unknown, headers: Record<string, string> = {}) => {
    return new NextRequest('https://aquadorcy.com/api/heartbeat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '192.168.1.1',
        'user-agent': 'Mozilla/5.0 Test Browser',
        ...headers,
      },
      body: JSON.stringify(body),
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default: no rate limit
    mockCheckRateLimit.mockResolvedValue(null);

    // Default Supabase responses
    mockSupabaseInsert.mockResolvedValue({ data: null, error: null });

    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'site_visitors') {
        return {
          insert: mockSupabaseInsert,
        };
      }
      return {};
    });
  });

  describe('Happy Path', () => {
    it('should accept valid heartbeat', async () => {
      const request = createMockRequest({
        sessionId: 'sess_12345678',
        page: '/shop/women',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
    });

    it('should insert visitor data', async () => {
      const request = createMockRequest({
        sessionId: 'sess_test_visitor',
        page: '/create-perfume',
      });

      await POST(request);

      expect(mockSupabaseInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          session_id: 'sess_test_visitor',
          page: '/create-perfume',
        })
      );
    });

    it('should hash IP address for privacy', async () => {
      const request = createMockRequest(
        { sessionId: 'sess_privacy_test' },
        { 'x-forwarded-for': '123.456.789.012' }
      );

      await POST(request);

      const insertCall = mockSupabaseInsert.mock.calls[0][0];
      expect(insertCall.ip_hash).toBeDefined();
      expect(insertCall.ip_hash).toHaveLength(64); // SHA-256 hex string
      expect(insertCall.ip_hash).not.toContain('123.456.789.012');
    });

    it('should include user agent and country', async () => {
      const request = createMockRequest(
        { sessionId: 'sess_metadata_test' },
        {
          'user-agent': 'Chrome/100 Test',
          'x-vercel-ip-country': 'CY',
        }
      );

      await POST(request);

      const insertCall = mockSupabaseInsert.mock.calls[0][0];
      expect(insertCall.user_agent).toBe('Chrome/100 Test');
      expect(insertCall.country).toBe('CY');
    });

  });

  describe('Validation', () => {
    it('should return 400 for missing sessionId', async () => {
      const request = createMockRequest({});

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid session');
    });

    it('should return 400 for empty sessionId', async () => {
      const request = createMockRequest({
        sessionId: '',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid session');
    });

    it('should return 400 for oversized sessionId', async () => {
      const request = createMockRequest({
        sessionId: 'a'.repeat(129), // Max is 128
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid session');
    });

    it('should handle optional page parameter', async () => {
      const request = createMockRequest({
        sessionId: 'sess_no_page',
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
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
        sessionId: 'sess_rate_limit',
      });

      const response = await POST(request);
      expect(response.status).toBe(429);
    });
  });

  describe('Error Handling', () => {
    it('should return 500 for database errors', async () => {
      mockSupabaseInsert.mockRejectedValue(new Error('Database connection failed'));

      const request = createMockRequest({
        sessionId: 'sess_error_test',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Server error');
    });
  });
});
