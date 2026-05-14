# Phase 4: Admin API Security - Research

**Researched:** 2026-02-28
**Domain:** Next.js middleware, API route authentication, Supabase RLS patterns
**Confidence:** HIGH

## Summary

This research confirms a **critical security vulnerability** in the admin API routes. The middleware at `src/middleware.ts` successfully protects `/admin/*` UI routes but **fails to protect `/api/admin/*` API routes** despite the matcher configuration claiming to cover both.

The vulnerability allows **unauthenticated access** to the `/api/admin/orders` POST endpoint, which can create manual orders and modify customer data in the database. This bypasses all authentication and authorization checks.

The blog API routes (`/api/blog`, `/api/blog/[slug]`) implement the **correct authentication pattern** that should be replicated across all admin API routes.

**Primary recommendation:** Add inline authentication checks to all `/api/admin/*` route handlers using the established pattern from blog routes: `createClient() → auth.getUser() → verify admin_users table membership`.

## Current State Analysis

### Middleware Implementation (`src/middleware.ts`)

**Lines 5-71:** Middleware function with two responsibilities:
1. **Request ID generation** (lines 6-11, 68) - Adds unique `x-request-id` header to all matched requests
2. **Admin route authentication** (lines 19-65) - Checks user auth and admin_users table membership

**Lines 73-76:** Matcher configuration
```typescript
export const config = {
  matcher: ['/api/:path*', '/admin/:path*'],
};
```

**Authentication flow for `/admin/*` routes (lines 19-64):**
1. Check if route starts with `/admin` (line 19)
2. Exclude `/admin/login` from auth check (line 20)
3. Create Supabase client with cookie handling (lines 24-47)
4. Get authenticated user via `supabase.auth.getUser()` (line 49)
5. Redirect to `/admin/login` if no user (lines 51-53)
6. Query `admin_users` table for user.id (lines 56-60)
7. Redirect to `/admin/login?error=unauthorized` if not found (lines 62-64)

### The Vulnerability: Why `/api/admin/*` Routes Are Not Protected

**Root cause:** The middleware's `isAdminRoute` check (line 19) only evaluates routes that start with `/admin`:

```typescript
const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
```

This condition is `false` for `/api/admin/orders` because it starts with `/api`, not `/admin`. Therefore:
- Lines 23-65 (entire auth block) are **skipped** for API routes
- Only request ID header is added (lines 6-11, 68)
- Request passes through to route handler **without any authentication**

**Evidence:** The matcher `['/api/:path*', '/admin/:path*']` runs the middleware, but the conditional logic inside middleware only applies authentication to `/admin` paths, not `/api/admin` paths.

### Unprotected Admin API Routes

#### 1. `/api/admin/orders` (POST)
**File:** `src/app/api/admin/orders/route.ts`
**Lines:** 30-122
**Current auth:** NONE
**Vulnerability:** Anyone can create manual orders and manipulate customer data

**Impact:**
- Creates orders in `orders` table with `order_source: 'manual'` (line 48)
- Upserts customer records in `customers` table (lines 71-111)
- Modifies `total_orders`, `total_spent`, `shipping_addresses` (lines 89-98)
- No authentication or authorization checks whatsoever

**Uses:** `createAdminClient()` from `@/lib/supabase/admin` (lines 3, 41) - service role key with full database access

#### 2. `/api/admin/setup` (POST, PUT)
**File:** `src/app/api/admin/setup/route.ts`
**Lines:** 29-136
**Current auth:** Custom setup key validation only (lines 16-27)
**Status:** Protected by `ADMIN_SETUP_SECRET` env var and `ADMIN_SETUP_COMPLETE` flag

**Notes:**
- Not vulnerable to the same issue (has its own auth mechanism)
- POST creates initial admin user (lines 30-86)
- PUT updates existing admin password (lines 89-136)
- Uses timing-safe comparison for setup key (line 23)

### Admin Users Table Structure (`src/lib/supabase/types.ts`)

**Lines 12-31:** `admin_users` table schema
```typescript
admin_users: {
  Row: {
    id: string              // Foreign key to auth.users.id
    email: string
    role: "admin" | "super_admin" | null
    created_at: string | null
  }
}
```

**Lines 385:** Enum definition
```typescript
admin_role: "admin" | "super_admin"
```

**Critical detail:** The `id` field is the Supabase auth user ID, allowing joins between `auth.users` and `admin_users`.

## Correct Authentication Pattern (from Blog API)

### Example: `/api/blog` POST route

**File:** `src/app/api/blog/route.ts`
**Lines:** 70-108
**Pattern implemented:**

1. **Create server client** (line 71)
   ```typescript
   const supabase = await createClient();
   ```

2. **Get authenticated user** (line 73)
   ```typescript
   const { data: { user } } = await supabase.auth.getUser();
   if (!user) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   }
   ```

3. **Verify admin membership** (lines 78-86)
   ```typescript
   const { data: adminUser } = await supabase
     .from('admin_users')
     .select('id')
     .eq('id', user.id)
     .single();

   if (!adminUser) {
     return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
   }
   ```

4. **Proceed with authorized operation** (lines 88-107)

**This pattern is consistently applied in:**
- `/api/blog` POST (lines 70-108)
- `/api/blog/[slug]` PUT (lines 27-71)
- `/api/blog/[slug]` DELETE (lines 73-105)

### Supabase Client Functions

**Server client** (`src/lib/supabase/server.ts`)
- **Lines 1-29:** Exports `createClient()` function
- Uses `createServerClient` from `@supabase/ssr`
- Handles cookies via Next.js `cookies()` helper (line 6)
- Uses **anon key** (line 10) - respects RLS policies
- Appropriate for user-scoped operations

**Admin client** (`src/lib/supabase/admin.ts`)
- **Lines 1-15:** Exports `createAdminClient()` function
- Uses `createClient` from `@supabase/supabase-js`
- Uses **service role key** (line 6) - bypasses RLS
- No session persistence (line 13)
- Should ONLY be used after authentication verification

### Why Current `/api/admin/orders` Implementation is Wrong

**Line 41:** Uses `createAdminClient()` immediately without any auth check
```typescript
const supabase = createAdminClient();
```

**Problem:** Service role client bypasses Row Level Security, providing full database access to unauthenticated requests.

**Correct approach:**
1. Use `createClient()` first to verify authentication
2. Check admin_users membership
3. Only then use `createAdminClient()` for privileged operations if needed
4. Better yet: use RLS policies and avoid service role key when possible

## Architecture Patterns

### Standard Admin API Route Structure

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin'; // Only if needed

export async function POST(request: NextRequest) {
  // 1. Create server client (uses cookies, respects RLS)
  const supabase = await createClient();

  // 2. Verify authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 3. Verify admin membership
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('id, role')  // Include role if needed for permission checks
    .eq('id', user.id)
    .single();

  if (!adminUser) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 4. Optional: Check role-based permissions
  // if (adminUser.role !== 'super_admin') {
  //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  // }

  // 5. Parse and validate request body
  const body = await request.json();
  // ... validation logic ...

  // 6. Use admin client ONLY if service role is required
  // Prefer using regular client with RLS policies when possible
  const adminSupabase = createAdminClient();

  // 7. Perform database operations
  const { data, error } = await adminSupabase
    .from('table_name')
    .insert(...)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
```

### Error Response Standards

Based on blog API and Next.js conventions:
- **401 Unauthorized:** No valid auth session (`!user`)
- **403 Forbidden:** Valid auth but insufficient permissions (`!adminUser`)
- **400 Bad Request:** Invalid input data
- **500 Internal Server Error:** Database or server errors

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Authentication checks | Custom auth middleware per route | Standardized auth helper function | Consistency, less duplication |
| Session validation | Manual JWT parsing | `supabase.auth.getUser()` | Handles token refresh, validation |
| Admin role checking | Custom role logic | Query admin_users table | Single source of truth |
| Request validation | Manual checks | Zod schemas (if needed) | Type safety, better errors |

**Insight:** The blog API routes have the correct pattern. Extract this into a reusable helper rather than duplicating across routes.

## Common Pitfalls

### Pitfall 1: Middleware Matcher Doesn't Guarantee Route Protection
**What goes wrong:** Developer assumes matcher `['/api/:path*']` means all API routes are automatically authenticated
**Why it happens:** Middleware runs on matched routes, but conditional logic inside middleware can exclude paths
**How to avoid:** Always add inline authentication checks in route handlers for sensitive endpoints
**Warning signs:**
- Middleware has conditional logic like `if (pathname.startsWith('/admin'))`
- API routes in different path segments (`/api/admin/*` vs `/admin/*`)
- No auth code visible in route handler file

### Pitfall 2: Using Admin Client Without Authentication
**What goes wrong:** `createAdminClient()` bypasses RLS, exposing full database access to unauthenticated users
**Why it happens:** Developer copies admin client pattern without understanding security implications
**How to avoid:** Always authenticate BEFORE creating admin client
**Warning signs:**
- `createAdminClient()` appears before any auth checks
- No `auth.getUser()` call in route handler
- Service role key used for operations that could use RLS

### Pitfall 3: Inconsistent Auth Patterns Across Endpoints
**What goes wrong:** Some routes check auth, others don't - creates confusion and security gaps
**Why it happens:** No standardized auth helper, copy-paste errors
**How to avoid:** Create reusable auth middleware or helper function
**Warning signs:**
- Different auth code in each route file
- Some routes have auth checks, others don't
- No shared auth utilities

### Pitfall 4: Testing Only UI Routes, Not API Routes Directly
**What goes wrong:** Vulnerability undetected because UI prevents access, but API is still exposed
**Why it happens:** Testing focuses on user flows through UI
**How to avoid:** Test API endpoints directly with curl/Postman without auth headers
**Warning signs:**
- Security audit only checks page access
- No API-level security tests
- Reliance on "frontend can't call it" as security

## Code Examples

Verified patterns from official sources:

### Example 1: Blog POST Route Authentication
**Source:** `src/app/api/blog/route.ts` (lines 70-86)
```typescript
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify user is an admin
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', user.id)
    .single();

  if (!adminUser) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Proceed with authorized operation...
}
```

### Example 2: Current Vulnerable Pattern
**Source:** `src/app/api/admin/orders/route.ts` (lines 30-42)
```typescript
export async function POST(request: NextRequest) {
  try {
    const body: ManualOrderBody = await request.json();

    if (!body.customerEmail || !body.total || body.total <= 0) {
      return NextResponse.json(
        { error: 'Customer email and total are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient(); // ❌ NO AUTH CHECK

    // Immediately uses service role client...
  }
}
```

### Example 3: Middleware Auth Logic for UI Routes
**Source:** `src/middleware.ts` (lines 49-64)
```typescript
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  return NextResponse.redirect(new URL('/admin/login', request.url));
}

// Check if user is an admin - use maybeSingle to avoid throwing on no results
const { data: adminUser, error: adminError } = await supabase
  .from('admin_users')
  .select('id')
  .eq('id', user.id)
  .maybeSingle();

if (adminError || !adminUser) {
  return NextResponse.redirect(new URL('/admin/login?error=unauthorized', request.url));
}
```

**Note:** Uses `.maybeSingle()` instead of `.single()` to avoid throwing errors - good defensive pattern.

## Recommended Implementation Strategy

### Option A: Extract Reusable Auth Helper (RECOMMENDED)

**Create:** `src/lib/auth/admin.ts`
```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface AuthResult {
  authorized: true;
  userId: string;
  role: 'admin' | 'super_admin';
}

interface AuthError {
  authorized: false;
  response: NextResponse;
}

export async function requireAdmin(): Promise<AuthResult | AuthError> {
  const supabase = await createClient();

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    };
  }

  // Check admin membership
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!adminUser) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    };
  }

  return {
    authorized: true,
    userId: user.id,
    role: adminUser.role || 'admin'
  };
}
```

**Usage in route:**
```typescript
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  // auth.userId and auth.role available here
  // Proceed with authorized operations...
}
```

### Option B: Inline Checks (Faster to Implement)

Copy the blog API pattern directly into each admin route handler:
1. `createClient()`
2. `auth.getUser()` → return 401 if no user
3. Query `admin_users` → return 403 if not found
4. Continue with operation

**Pros:** No new files, clear what's happening in each route
**Cons:** Code duplication, easier to miss a route during audit

## File Locations

### Files Requiring Modification

| File | Lines | Change Required |
|------|-------|-----------------|
| `src/app/api/admin/orders/route.ts` | 30-42 | Add auth checks before line 41 |
| `src/middleware.ts` | 19-65 | Optional: extend to cover `/api/admin/*` (not recommended, see note below) |

**Note on middleware approach:** Extending middleware to handle `/api/admin/*` would require:
- Change line 19 to: `const isAdminRoute = request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/api/admin');`
- Add exclusion for `/api/admin/setup` like `/admin/login`

**However, this is NOT RECOMMENDED because:**
- Middleware runs on Edge Runtime with limited Node.js APIs
- Cannot easily return JSON error responses from middleware for API routes
- Mixing redirect logic (UI routes) and JSON response logic (API routes) in one middleware is complex
- Inline checks are more explicit and easier to audit

### New Files to Create (Option A)

| File | Purpose |
|------|---------|
| `src/lib/auth/admin.ts` | Reusable admin authentication helper |
| `src/lib/auth/__tests__/admin.test.ts` | Unit tests for auth helper (optional) |

## Testing Strategy

### Manual Testing: Verify Vulnerability Exists

**Test 1: Unauthenticated POST to `/api/admin/orders`**
```bash
curl -X POST https://aquadorcy.com/api/admin/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerEmail": "test@example.com",
    "items": [{"name": "Test Product", "quantity": 1, "price": 99.99}],
    "total": 99.99
  }'
```

**Expected (current vulnerable state):** 200 OK with order created
**Expected (after fix):** 401 Unauthorized

### Manual Testing: Verify Fix Works

**Test 2: Same request after implementing auth checks**
```bash
# Should fail with 401
curl -X POST http://localhost:3000/api/admin/orders \
  -H "Content-Type: application/json" \
  -d '{"customerEmail": "test@example.com", "items": [{"name": "Test", "quantity": 1, "price": 10}], "total": 10}'
```

**Test 3: With valid admin session cookie**
```bash
# First login to get session cookie
# Then make request with cookie
curl -X POST http://localhost:3000/api/admin/orders \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN; sb-refresh-token=YOUR_REFRESH" \
  -d '{"customerEmail": "test@example.com", "items": [{"name": "Test", "quantity": 1, "price": 10}], "total": 10}'
```

**Expected:** 200 OK with order created (authorized admin)

### Automated Testing Strategy

**E2E test file:** `e2e/admin-api-security.spec.ts`

Test cases:
1. **Unauthenticated access blocked**
   - POST to `/api/admin/orders` without auth → expect 401

2. **Non-admin authenticated user blocked**
   - Create regular user, login, POST to admin API → expect 403

3. **Admin access allowed**
   - Login as admin, POST to admin API → expect 200/201

4. **All admin API endpoints protected**
   - Test GET/POST/PUT/DELETE on all `/api/admin/*` routes
   - Verify 401 without auth, 200/201 with admin auth

### Regression Testing

After implementing fixes:
1. Run full E2E test suite: `npm run test:e2e`
2. Verify admin panel UI still works: `/admin/orders/new` form submission
3. Check all blog API routes still work: `npm test -- src/app/api/blog`
4. Monitor Sentry for auth-related errors in production

## Open Questions

### 1. Should we implement role-based permissions?
- **What we know:** `admin_users` table has `role` field with `admin` and `super_admin` values
- **What's unclear:** Are there operations that should be `super_admin` only?
- **Recommendation:** Start with binary admin/non-admin. Add role checks later if needed for destructive operations (DELETE endpoints, settings changes)

### 2. Should `/api/admin/setup` be protected differently?
- **What we know:** Has custom setup key auth, disabled when `ADMIN_SETUP_COMPLETE=true`
- **What's unclear:** Should this route follow the same pattern or keep custom auth?
- **Recommendation:** Keep current implementation - it's bootstrap-only and has appropriate safeguards

### 3. Are there other admin API routes we haven't discovered?
- **What we know:** Found `/api/admin/orders` and `/api/admin/setup`
- **What's unclear:** Could there be more admin APIs in the future?
- **Recommendation:** Implement reusable helper (Option A) to make future admin routes secure by default

### 4. Should we add rate limiting to admin APIs?
- **What we know:** `src/lib/rate-limit.ts` exists with Upstash Redis integration
- **What's unclear:** Is rate limiting needed for admin routes?
- **Recommendation:** Not critical for Phase 4. Add if admin endpoints are exposed to internet and abuse is a concern.

## State of the Art

### Next.js Middleware Limitations (as of Next.js 14)

| Capability | Available in Middleware | Available in Route Handler |
|------------|-------------------------|----------------------------|
| Edge Runtime | ✅ Yes (required) | ⚠️ Optional |
| Full Node.js APIs | ❌ No | ✅ Yes |
| Cookie access | ✅ Yes | ✅ Yes |
| Database queries | ⚠️ Limited (edge-compatible only) | ✅ Yes |
| JSON responses | ⚠️ Possible but awkward | ✅ Natural |
| Redirects | ✅ Natural | ⚠️ Possible but awkward |

**Insight:** Middleware is better for:
- Adding headers (request IDs, security headers)
- Redirecting unauthorized users (UI routes)
- Rewriting URLs

Route handlers are better for:
- API authentication with JSON error responses
- Complex database queries
- Business logic

**Current approach is correct:** Use middleware for UI route redirects, use inline checks for API routes.

### Supabase Auth Best Practices (2026)

**From `@supabase/ssr` documentation:**
1. Always use `createServerClient` for server-side operations that need user context
2. Use `createClient` (with service role) only for admin operations AFTER verifying permissions
3. Prefer RLS policies over service role when possible - they're auditable and safer

**RLS vs Service Role Decision Matrix:**

| Operation | Use RLS (anon key) | Use Service Role |
|-----------|-------------------|------------------|
| User reads own data | ✅ Preferred | ❌ Overkill |
| Admin reads user data | ⚠️ Possible with policies | ✅ Simpler |
| Admin writes on behalf of user | ❌ RLS won't allow | ✅ Required |
| Bootstrap operations | ❌ No user context | ✅ Required |

**For manual orders:** Service role is appropriate because we're inserting with `order_source: 'manual'` and the admin is acting on behalf of a customer, not as themselves.

## Sources

### Primary (HIGH confidence)
- `src/middleware.ts` - Lines 1-77 (middleware implementation and config)
- `src/app/api/admin/orders/route.ts` - Lines 1-123 (vulnerable endpoint)
- `src/app/api/blog/route.ts` - Lines 70-108 (correct auth pattern)
- `src/app/api/blog/[slug]/route.ts` - Lines 27-105 (consistent auth pattern)
- `src/lib/supabase/types.ts` - Lines 12-31, 385 (admin_users schema)
- `src/lib/supabase/server.ts` - Lines 1-29 (server client creation)
- `src/lib/supabase/admin.ts` - Lines 1-15 (admin client creation)

### Secondary (MEDIUM confidence)
- Next.js 14 documentation - Middleware patterns and Edge Runtime limitations
- Supabase SSR documentation - Server-side auth patterns for Next.js

### Tertiary (LOW confidence)
- None - all findings verified in codebase

## Metadata

**Confidence breakdown:**
- Vulnerability identification: HIGH - Confirmed by code inspection, clear logic flaw
- Authentication pattern: HIGH - Multiple working examples in codebase (blog routes)
- Recommended solution: HIGH - Follows established patterns in same codebase
- Testing strategy: MEDIUM - Based on standard security testing practices, not project-specific

**Research date:** 2026-02-28
**Valid until:** 90 days (stable patterns, unlikely to change unless Next.js/Supabase major version upgrade)

**Key files for planner:**
- Modify: `src/app/api/admin/orders/route.ts` (add auth)
- Optionally create: `src/lib/auth/admin.ts` (reusable helper)
- Reference: `src/app/api/blog/route.ts` (pattern to copy)
- Test: Create E2E test file to verify auth works

**Security severity:** CRITICAL - Unauthenticated write access to orders and customer data
**Effort to fix:** LOW - 15-30 lines of code per route, well-established pattern
**Risk of fix:** LOW - Adding auth checks won't break existing functionality for authorized users
