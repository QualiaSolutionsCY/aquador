/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

// Mock dependencies before imports
const mockSupabaseFrom = jest.fn();
const mockSupabaseSelect = jest.fn();
const mockSupabaseInsert = jest.fn();
const mockSupabaseEq = jest.fn();
const mockSupabaseSingle = jest.fn();
const mockSupabaseOrder = jest.fn();
const mockSupabaseRange = jest.fn();
const mockSupabaseAuthGetUser = jest.fn();

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: (...args: any[]) => mockSupabaseFrom(...args),
    auth: {
      getUser: () => mockSupabaseAuthGetUser(),
    },
  })),
}));

// Mock blog utilities
jest.mock('@/lib/blog', () => ({
  estimateReadTime: (content: string) => Math.ceil(content.split(' ').length / 200),
  generateSlug: (title: string) => title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
}));

// Import after all mocks
import { GET, POST } from '../route';

describe('Blog API Routes', () => {
  const createMockRequest = (url: string, body?: any) => {
    return new NextRequest(url, {
      method: body ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default Supabase chain for queries
    mockSupabaseSelect.mockReturnThis();
    mockSupabaseEq.mockReturnThis();
    mockSupabaseOrder.mockReturnThis();
    mockSupabaseRange.mockReturnThis();
    mockSupabaseSingle.mockReturnThis();
    mockSupabaseInsert.mockReturnThis();

    // Default: no authenticated user
    mockSupabaseAuthGetUser.mockResolvedValue({ data: { user: null }, error: null });
  });

  describe('GET /api/blog', () => {
    it('should return published blog posts', async () => {
      const mockPosts = [
        { id: '1', title: 'Test Post', status: 'published', content: 'Test content' },
      ];

      mockSupabaseFrom.mockReturnValue({
        select: mockSupabaseSelect.mockReturnValue({
          eq: mockSupabaseEq.mockReturnValue({
            order: mockSupabaseOrder.mockReturnValue({
              range: mockSupabaseRange.mockResolvedValue({
                data: mockPosts,
                error: null,
                count: 1,
              }),
            }),
          }),
        }),
      });

      const request = createMockRequest('https://aquadorcy.com/api/blog');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.posts).toEqual(mockPosts);
      expect(data.total).toBe(1);
      expect(data.page).toBe(1);
    });

    it('should filter by category', async () => {
      // Mock for category filtering
      const mockQuery = {
        eq: mockSupabaseEq.mockReturnThis(),
        order: mockSupabaseOrder.mockReturnThis(),
        range: mockSupabaseRange.mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      mockSupabaseFrom.mockReturnValue({
        select: mockSupabaseSelect.mockReturnValue(mockQuery),
      });

      const request = createMockRequest('https://aquadorcy.com/api/blog?category=fragrance');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.posts).toBeDefined();
    });

    it('should filter featured posts', async () => {
      // Mock for featured filtering
      const mockQuery = {
        eq: mockSupabaseEq.mockReturnThis(),
        order: mockSupabaseOrder.mockReturnThis(),
        range: mockSupabaseRange.mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      mockSupabaseFrom.mockReturnValue({
        select: mockSupabaseSelect.mockReturnValue(mockQuery),
      });

      const request = createMockRequest('https://aquadorcy.com/api/blog?featured=true');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.posts).toBeDefined();
    });

    it('should handle database errors', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: mockSupabaseSelect.mockReturnValue({
          eq: mockSupabaseEq.mockReturnValue({
            order: mockSupabaseOrder.mockReturnValue({
              range: mockSupabaseRange.mockResolvedValue({
                data: null,
                error: { message: 'Database error' },
              }),
            }),
          }),
        }),
      });

      const request = createMockRequest('https://aquadorcy.com/api/blog');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Database error');
    });

    it('should include cache headers for published posts', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: mockSupabaseSelect.mockReturnValue({
          eq: mockSupabaseEq.mockReturnValue({
            order: mockSupabaseOrder.mockReturnValue({
              range: mockSupabaseRange.mockResolvedValue({
                data: [],
                error: null,
                count: 0,
              }),
            }),
          }),
        }),
      });

      const request = createMockRequest('https://aquadorcy.com/api/blog');
      const response = await GET(request);

      expect(response.headers.get('Cache-Control')).toContain('public');
    });
  });

  describe('POST /api/blog', () => {
    it('should return 401 for unauthenticated users', async () => {
      mockSupabaseAuthGetUser.mockResolvedValue({ data: { user: null }, error: null });

      const request = createMockRequest('https://aquadorcy.com/api/blog', {
        title: 'Test Post',
        content: 'Test content',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 for non-admin users', async () => {
      mockSupabaseAuthGetUser.mockResolvedValue({
        data: { user: { id: 'user_1', email: 'user@example.com' } },
        error: null,
      });

      mockSupabaseFrom.mockReturnValue({
        select: mockSupabaseSelect.mockReturnValue({
          eq: mockSupabaseEq.mockReturnValue({
            single: mockSupabaseSingle.mockResolvedValue({
              data: null, // Not an admin
              error: null,
            }),
            maybeSingle: mockSupabaseSingle.mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      const request = createMockRequest('https://aquadorcy.com/api/blog', {
        title: 'Test Post',
        content: 'Test content',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });

    it('should create post for admin users', async () => {
      mockSupabaseAuthGetUser.mockResolvedValue({
        data: { user: { id: 'admin_1', email: 'admin@example.com' } },
        error: null,
      });

      let adminCheckCalled = false;
      let insertCalled = false;

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'admin_users' && !adminCheckCalled) {
          adminCheckCalled = true;
          return {
            select: mockSupabaseSelect.mockReturnValue({
              eq: mockSupabaseEq.mockReturnValue({
                single: mockSupabaseSingle.mockResolvedValue({
                  data: { id: 'admin_1' },
                  error: null,
                }),
                maybeSingle: mockSupabaseSingle.mockResolvedValue({
                  data: { id: 'admin_1' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'blog_posts' && !insertCalled) {
          insertCalled = true;
          return {
            insert: mockSupabaseInsert.mockReturnValue({
              select: mockSupabaseSelect.mockReturnValue({
                single: mockSupabaseSingle.mockResolvedValue({
                  data: {
                    id: 'post_1',
                    title: 'Test Post',
                    slug: 'test-post',
                    content: 'Test content',
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return mockSupabaseFrom(table);
      });

      const request = createMockRequest('https://aquadorcy.com/api/blog', {
        title: 'Test Post',
        content: 'Test content',
        status: 'published',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe('post_1');
      expect(data.slug).toBe('test-post');
    });

    it('should return 400 for invalid post data', async () => {
      mockSupabaseAuthGetUser.mockResolvedValue({
        data: { user: { id: 'admin_1' } },
        error: null,
      });

      mockSupabaseFrom.mockReturnValue({
        select: mockSupabaseSelect.mockReturnValue({
          eq: mockSupabaseEq.mockReturnValue({
            single: mockSupabaseSingle.mockResolvedValue({
              data: { id: 'admin_1' },
              error: null,
            }),
            maybeSingle: mockSupabaseSingle.mockResolvedValue({
              data: { id: 'admin_1' },
              error: null,
            }),
          }),
        }),
      });

      const request = createMockRequest('https://aquadorcy.com/api/blog', {
        // Missing required fields
        title: '',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });
  });
});
