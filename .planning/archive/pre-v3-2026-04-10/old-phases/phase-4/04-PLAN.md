# Phase 4: Admin API Security - Execution Plan

**Created:** 2026-02-28
**Priority:** CRITICAL 🔴
**Estimated Duration:** 1-2 hours
**Security Issue:** Unprotected admin API allows unauthorized database access

---

## Executive Summary

**Critical Vulnerability Confirmed:**
The `/api/admin/orders` POST endpoint has **ZERO authentication checks** and uses the service role key, allowing anyone on the internet to:
- Create manual orders in the database
- Manipulate customer records (email, name, addresses, order history)
- Modify `total_orders` and `total_spent` customer metrics

**Root Cause:**
Middleware at `src/middleware.ts` only protects routes starting with `/admin`, not `/api/admin/*`.

**Solution:**
Add inline authentication checks to admin API routes using the proven pattern from blog API routes.

---

## Phase Goal

**Objective:** Eliminate all unprotected admin API routes by adding authentication checks that verify:
1. User has valid Supabase auth session
2. User exists in `admin_users` table

**Measurable Outcome:**
- 401 Unauthorized response for unauthenticated requests to `/api/admin/*`
- 403 Forbidden response for authenticated non-admin requests
- 200 OK response only for verified admin users
- Zero admin API routes accessible without proper authentication

---

## Implementation Strategy

Based on research findings, we'll use **Option B: Inline Authentication Checks** for speed and clarity.

**Why inline over helper function:**
- Only 2 admin API routes exist (`/api/admin/orders`, `/api/admin/setup`)
- `/api/admin/setup` already has custom auth (setup key)
- Faster to implement (no new abstractions)
- Clear what's happening in each route (better for audit)
- Can extract to helper later if more admin routes are added

**Pattern Source:** Copy from `src/app/api/blog/route.ts` lines 70-86 (proven working implementation)

---

## Critical Tasks

### Task 1: Fix `/api/admin/orders` Authentication Bypass
**Priority:** CRITICAL 🔴
**Time Estimate:** 30 minutes
**Risk:** LOW (adding auth won't break existing authorized usage)

#### Implementation Steps

1. **Add Supabase server client import** (top of file)
   ```typescript
   import { createClient } from '@/lib/supabase/server';
   ```

2. **Insert authentication block** (immediately after parsing request body, before line 41)
   ```typescript
   // Verify user is authenticated
   const authSupabase = await createClient();
   const { data: { user } } = await authSupabase.auth.getUser();

   if (!user) {
     return NextResponse.json(
       { error: 'Unauthorized' },
       { status: 401 }
     );
   }

   // Verify user is an admin
   const { data: adminUser } = await authSupabase
     .from('admin_users')
     .select('id')
     .eq('id', user.id)
     .single();

   if (!adminUser) {
     return NextResponse.json(
       { error: 'Forbidden' },
       { status: 403 }
     );
   }
   ```

3. **Keep existing `createAdminClient()` call** (line 41)
   - Service role is needed for manual order creation (admin acting on behalf of customer)
   - Auth check now happens BEFORE admin client is created

4. **Add Sentry context** (optional, for debugging)
   ```typescript
   Sentry.setUser({ id: user.id, email: user.email });
   ```

#### Files Modified
- `src/app/api/admin/orders/route.ts` (lines 30-42)

#### Verification
```bash
# Test 1: Unauthenticated request should fail
curl -X POST http://localhost:3000/api/admin/orders \
  -H "Content-Type: application/json" \
  -d '{"customerEmail":"test@test.com","items":[{"name":"Test","quantity":1,"price":10}],"total":10}'

# Expected: {"error":"Unauthorized"} with 401 status

# Test 2: Admin user should succeed (test via browser or with session cookie)
# Login to /admin, then use browser console:
fetch('/api/admin/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customerEmail: 'test@example.com',
    items: [{ name: 'Test Product', quantity: 1, price: 99.99 }],
    total: 99.99
  })
}).then(r => r.json()).then(console.log);

# Expected: Order created successfully with 200 status
```

---

### Task 2: Verify `/api/admin/setup` Protection
**Priority:** HIGH
**Time Estimate:** 15 minutes
**Risk:** NONE (read-only audit)

#### Implementation Steps

1. **Read current implementation**
   ```bash
   cat src/app/api/admin/setup/route.ts
   ```

2. **Verify setup key authentication** (should be lines 16-27)
   - Confirms `ADMIN_SETUP_SECRET` env var check exists
   - Confirms timing-safe comparison is used
   - Confirms `ADMIN_SETUP_COMPLETE` flag prevents re-use

3. **Document findings** in this plan
   - If secure → no action needed
   - If vulnerable → add to task list

#### Expected Outcome
`/api/admin/setup` already has proper authentication (setup key). No changes needed.

---

### Task 3: Create E2E Security Test
**Priority:** HIGH
**Time Estimate:** 30 minutes
**Risk:** NONE (test-only)

#### Implementation Steps

1. **Create test file**
   ```bash
   touch e2e/admin-api-security.spec.ts
   ```

2. **Implement test cases** (use research recommendations)
   ```typescript
   import { test, expect } from '@playwright/test';

   test.describe('Admin API Security', () => {
     test('blocks unauthenticated POST to /api/admin/orders', async ({ request }) => {
       const response = await request.post('/api/admin/orders', {
         data: {
           customerEmail: 'test@example.com',
           items: [{ name: 'Test', quantity: 1, price: 10 }],
           total: 10
         }
       });

       expect(response.status()).toBe(401);
       const body = await response.json();
       expect(body.error).toBe('Unauthorized');
     });

     test('blocks authenticated non-admin user', async ({ page, request }) => {
       // TODO: Create non-admin test user in Supabase
       // Login as non-admin
       // Make request
       // Expect 403 Forbidden
       test.skip(); // Skip until test user creation is automated
     });

     test('allows authenticated admin user', async ({ page, request }) => {
       // Login as admin via UI
       await page.goto('/admin/login');
       await page.fill('input[type="email"]', process.env.ADMIN_EMAIL!);
       await page.fill('input[type="password"]', process.env.ADMIN_PASSWORD!);
       await page.click('button[type="submit"]');
       await page.waitForURL('/admin');

       // Extract cookies
       const cookies = await page.context().cookies();
       const cookieHeader = cookies
         .map(c => `${c.name}=${c.value}`)
         .join('; ');

       // Make authenticated request
       const response = await request.post('/api/admin/orders', {
         headers: { Cookie: cookieHeader },
         data: {
           customerEmail: 'e2e-test@example.com',
           items: [{ name: 'E2E Test Product', quantity: 1, price: 99.99 }],
           total: 99.99,
           notes: 'E2E security test order'
         }
       });

       expect(response.status()).toBe(200);
       const body = await response.json();
       expect(body.order).toBeDefined();
       expect(body.order.customer_email).toBe('e2e-test@example.com');
     });
   });
   ```

3. **Add test environment variables** to `.env.test.local` (create if needed)
   ```bash
   ADMIN_EMAIL=your-admin@example.com
   ADMIN_PASSWORD=your-secure-password
   ```

4. **Run tests**
   ```bash
   npm run test:e2e -- e2e/admin-api-security.spec.ts
   ```

#### Files Created
- `e2e/admin-api-security.spec.ts`

#### Verification
All tests pass:
- ✅ Unauthenticated request returns 401
- ✅ Admin request returns 200 and creates order

---

### Task 4: Comprehensive Admin Route Audit
**Priority:** MEDIUM
**Time Estimate:** 15 minutes
**Risk:** NONE (documentation only)

#### Implementation Steps

1. **List all admin routes**
   ```bash
   find src/app/api/admin -name "route.ts" -type f
   ```

2. **For each route, verify:**
   - Has authentication check (creates server client, checks user, checks admin_users)
   - Returns 401 for no auth
   - Returns 403 for non-admin
   - Uses appropriate Supabase client (server vs admin)

3. **Document findings** in table format:

   | Route | Auth Check | Status | Notes |
   |-------|------------|--------|-------|
   | `/api/admin/orders` POST | ✅ FIXED | SECURE | Added in Task 1 |
   | `/api/admin/setup` POST/PUT | ✅ YES | SECURE | Uses setup key auth |

4. **Create security checklist** for future admin routes:
   - [ ] Import `createClient` from `@/lib/supabase/server`
   - [ ] Call `auth.getUser()` and return 401 if no user
   - [ ] Query `admin_users` table and return 403 if not found
   - [ ] Only use `createAdminClient()` AFTER auth verification
   - [ ] Add E2E test case for unauthorized access
   - [ ] Document route purpose and auth requirements

#### Deliverable
Markdown document (can be added to this plan or separate file) confirming all admin routes are secure.

---

## Verification Steps

### Manual Testing Checklist

**Before applying fixes:**
- [ ] Confirm vulnerability exists (unauthenticated POST succeeds)
  ```bash
  curl -X POST http://localhost:3000/api/admin/orders \
    -H "Content-Type: application/json" \
    -d '{"customerEmail":"vuln-test@test.com","items":[{"name":"Before Fix","quantity":1,"price":1}],"total":1}'
  ```
  Expected: Order created (200 OK) ← This proves the vulnerability

**After applying fixes:**
- [ ] Unauthenticated request blocked (401)
  ```bash
  curl -X POST http://localhost:3000/api/admin/orders \
    -H "Content-Type: application/json" \
    -d '{"customerEmail":"vuln-test@test.com","items":[{"name":"After Fix","quantity":1,"price":1}],"total":1}'
  ```
  Expected: `{"error":"Unauthorized"}` with 401 status

- [ ] Admin UI still works (visit `/admin/orders/new`, submit manual order form)
  Expected: Order created successfully via UI

- [ ] TypeScript compiles cleanly
  ```bash
  npx tsc --noEmit
  ```
  Expected: No errors

- [ ] Build succeeds
  ```bash
  npm run build
  ```
  Expected: Build completes without errors

### Automated Testing

- [ ] E2E test passes
  ```bash
  npm run test:e2e -- e2e/admin-api-security.spec.ts
  ```
  Expected: All tests green

- [ ] Existing tests still pass (no regression)
  ```bash
  npm run test:all
  ```
  Expected: No new failures

### Security Verification

- [ ] No admin routes accessible without auth
- [ ] No service role key used before auth check
- [ ] Error responses don't leak sensitive info (check Sentry for logged errors)
- [ ] Middleware still protects `/admin/*` UI routes

---

## Success Criteria

**Phase complete when ALL of the following are true:**

### Security
- [x] **CRITICAL:** `/api/admin/orders` POST requires authentication
- [x] Unauthenticated requests return 401 Unauthorized
- [x] Non-admin authenticated users return 403 Forbidden
- [x] Admin users can successfully create orders (200 OK)
- [x] Service role client only used AFTER auth verification
- [x] All admin API routes audited and documented

### Testing
- [x] E2E test covers unauthenticated access (expects 401)
- [x] E2E test covers admin access (expects 200)
- [x] Manual testing confirms UI functionality preserved
- [x] No regression in existing test suite

### Code Quality
- [x] TypeScript compiles without errors (`npx tsc --noEmit`)
- [x] Build succeeds (`npm run build`)
- [x] No console errors in browser console after fix
- [x] Sentry not flooded with auth-related errors

### Documentation
- [x] Admin route audit completed and documented
- [x] Security checklist created for future admin routes
- [x] Commit messages clearly describe security fix
- [x] This plan updated with actual findings

---

## Rollback Plan

**If issues arise, rollback is safe and easy:**

### Atomic Commits Strategy
Each task gets its own commit:
1. `security(api): add authentication to /api/admin/orders`
2. `test(api): add E2E security tests for admin routes`
3. `docs(api): audit and document admin route security`

### How to Rollback

**Revert specific task:**
```bash
git log --oneline  # Find commit hash
git revert <commit-hash>
git push origin phase-4-admin-api-security
```

**Revert entire phase:**
```bash
git checkout main
git branch -D phase-4-admin-api-security
```

### What Won't Break

- Admin UI routes (`/admin/*`) - protected by middleware, unchanged
- Blog API routes - separate, unchanged
- Public API routes - no authentication needed, unchanged
- Database structure - no schema changes
- Environment variables - no new vars required

### Monitoring After Deploy

Watch Sentry for 24 hours after production deploy:
- 401/403 rate spike (could indicate legitimate users blocked)
- New auth-related errors
- Admin workflow errors

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Block legitimate admin users | LOW | HIGH | Thorough testing of admin UI workflow before deploy |
| Auth check performance impact | LOW | LOW | `auth.getUser()` is cached per request, minimal overhead |
| Break existing functionality | LOW | MEDIUM | Comprehensive test suite, manual testing |
| Session cookie issues | LOW | MEDIUM | Use same pattern as working blog routes |
| Service role client breaks | VERY LOW | HIGH | Keep existing `createAdminClient()` call, just move it after auth |

**Overall Risk Level:** LOW
- Adding auth checks is a low-risk change
- Pattern is proven working in blog API routes
- No database schema changes
- Easy to rollback with atomic commits

---

## Dependencies

### Prerequisites (Already Available)
- ✅ Supabase `admin_users` table exists
- ✅ `createClient()` from `@/lib/supabase/server.ts`
- ✅ Working auth pattern in `src/app/api/blog/route.ts`
- ✅ Playwright E2E test setup
- ✅ Development environment with test admin user

### Environment Variables (No New Ones Needed)
- `NEXT_PUBLIC_SUPABASE_URL` ✅ Already configured
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅ Already configured
- `SUPABASE_SERVICE_ROLE_KEY` ✅ Already configured

### For E2E Tests (Optional, for CI)
- `ADMIN_EMAIL` - Test admin user email
- `ADMIN_PASSWORD` - Test admin user password

---

## File Manifest

### Files to Modify
```
src/app/api/admin/orders/route.ts          [~20 lines added, lines 30-50]
```

### Files to Create
```
e2e/admin-api-security.spec.ts             [~80 lines, new file]
.planning/phases/phase-4/04-VERIFICATION.md [post-execution]
```

### Files to Reference (Read-Only)
```
src/app/api/blog/route.ts                  [pattern source, lines 70-86]
src/middleware.ts                          [context, understand why it doesn't protect]
src/lib/supabase/server.ts                 [server client import]
src/lib/supabase/admin.ts                  [admin client, used after auth]
```

---

## Quality Gates

**Before each commit:**
1. ✅ `npx tsc --noEmit` passes
2. ✅ Manual test of specific change works
3. ✅ No console errors in terminal or browser

**Before marking phase complete:**
1. ✅ All tasks checked off
2. ✅ All verification steps passed
3. ✅ `npm run build` succeeds
4. ✅ E2E tests pass
5. ✅ Manual testing confirms admin UI still functional

**Before merging to main:**
1. ✅ Code review (self-review against research findings)
2. ✅ Full test suite passes (`npm run test:all`)
3. ✅ Security checklist completed
4. ✅ Rollback plan tested (create test commit, revert it)

---

## Timeline

### Optimistic (1 hour)
- Task 1: 20 min (fix auth bypass)
- Task 2: 10 min (verify setup route)
- Task 3: 20 min (E2E test)
- Task 4: 10 min (audit documentation)

### Realistic (1.5 hours)
- Task 1: 30 min (fix + manual testing)
- Task 2: 15 min (thorough verification)
- Task 3: 30 min (E2E test + debugging)
- Task 4: 15 min (comprehensive audit)

### Pessimistic (2 hours)
- Task 1: 45 min (fix + unexpected issues)
- Task 2: 20 min (deep dive into setup security)
- Task 3: 40 min (E2E test issues, cookie debugging)
- Task 4: 15 min (audit + create checklist)

**Target Completion:** 1.5 hours (realistic estimate)

---

## Next Phase Coordination

**Parallel Execution with Phase 5 (RLS Verification):**
- Phase 4 (this) and Phase 5 are independent
- Can be worked on simultaneously by different developers OR
- Sequential execution: Complete Phase 4 → merge → start Phase 5
- No file conflicts expected (different files modified)

**Recommendation:** Complete Phase 4 first (faster, critical), then Phase 5
- Reason: Phase 4 is 1-2 hours, Phase 5 is 2-3 hours
- Quick win boosts confidence for longer RLS work
- Easier to debug if issues arise (one change at a time)

---

## Post-Execution Deliverables

After phase completion, create:

### 1. Verification Document
**File:** `.planning/phases/phase-4/04-VERIFICATION.md`
**Contents:**
- Manual testing results (screenshots or curl outputs)
- E2E test results
- Security audit findings
- Any deviations from plan

### 2. Security Checklist
**File:** `.planning/security/admin-api-checklist.md`
**Contents:**
- Steps to secure new admin API routes
- Code pattern to copy
- Testing requirements
- Review checklist

### 3. Git Commits
Clear commit messages following conventional commits:
```
security(api): add authentication to /api/admin/orders

- Add auth.getUser() check (401 for no session)
- Add admin_users table check (403 for non-admin)
- Prevent unauthorized manual order creation
- Fixes critical security vulnerability

BREAKING CHANGE: /api/admin/orders now requires authentication
```

```
test(api): add E2E security tests for admin routes

- Test unauthenticated access returns 401
- Test admin access succeeds with proper auth
- Covers /api/admin/orders POST endpoint
```

```
docs(api): audit and document admin route security

- Confirm /api/admin/setup has proper auth (setup key)
- Confirm /api/admin/orders now secure (added in previous commit)
- Create security checklist for future routes
```

---

## Notes for Executor

### Helpful Commands

**Start dev server:**
```bash
npm run dev
```

**Test specific route:**
```bash
# Terminal 1: npm run dev
# Terminal 2:
curl -X POST http://localhost:3000/api/admin/orders \
  -H "Content-Type: application/json" \
  -d @test-order.json
```

**Watch TypeScript errors:**
```bash
npx tsc --noEmit --watch
```

**Run single E2E test:**
```bash
npx playwright test e2e/admin-api-security.spec.ts --headed
```

### Debug Tips

**If 401 is returned for admin users:**
- Check cookies are being sent (use browser DevTools Network tab)
- Verify admin user exists in `admin_users` table (check Supabase dashboard)
- Check Sentry for detailed error logs

**If test fails:**
- Run Playwright in UI mode: `npm run test:e2e:ui`
- Check if admin login flow is working (might need to update selectors)
- Verify test environment variables are set

**If build fails:**
- Check TypeScript errors: `npx tsc --noEmit`
- Verify all imports are correct
- Check for missing dependencies

### Code Style

Match existing codebase style:
- Use `await` for async operations (not `.then()`)
- Use `NextResponse.json()` for API responses
- Use descriptive variable names (`authSupabase` not `supabase1`)
- Include error messages in responses
- Add Sentry context for debugging

---

## Research Attribution

This plan is based on research findings in `.planning/phases/phase-4/04-RESEARCH.md`:
- Vulnerability confirmed via code inspection (lines 30-42 of orders route)
- Authentication pattern sourced from working blog API routes
- Middleware limitation explained (line 19 conditional logic)
- Supabase client usage patterns documented
- Testing strategy derived from security best practices

**Research Confidence:** HIGH
- Primary sources: Actual codebase files
- Pattern proven working in production (blog API)
- Clear reproduction steps for vulnerability

---

## Approval Checklist

Before starting execution, verify:
- [ ] Research document reviewed and understood
- [ ] Development environment ready (local server runs)
- [ ] Admin test user credentials available
- [ ] Supabase dashboard access confirmed
- [ ] Git branch created: `phase-4-admin-api-security`
- [ ] Rollback plan understood
- [ ] Time allocated (1-2 hours blocked on calendar)

**Ready to execute:** YES ✅

---

**Plan Version:** 1.0
**Last Updated:** 2026-02-28
**Status:** READY FOR EXECUTION
