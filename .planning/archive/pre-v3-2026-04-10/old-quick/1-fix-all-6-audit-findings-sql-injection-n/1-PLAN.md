---
phase: 1-fix-all-6-audit-findings-sql-injection-n
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/supabase/product-service.ts
  - src/lib/validation/cart.ts
  - src/app/api/webhooks/stripe/route.ts
  - src/app/api/ai-assistant/route.ts
  - src/app/api/contact/route.ts
  - src/app/api/checkout/route.ts
  - src/app/api/create-perfume/payment/route.ts
  - src/app/api/checkout/session-details/route.ts
  - src/app/api/admin/orders/route.ts
  - src/app/api/blog/route.ts
  - src/app/api/blog/[slug]/route.ts
  - src/app/api/heartbeat/route.ts
  - src/lib/rate-limit.ts
  - .gitignore
  - src/components/cart/CheckoutButton.tsx
  - src/components/cart/CartProvider.tsx
  - src/components/ai/ChatWidget.tsx
  - src/app/checkout/success/page.tsx
  - src/app/sitemap.ts
  - src/app/admin/page.tsx
  - src/app/admin/error.tsx
  - src/app/admin/products/page.tsx
  - src/app/admin/products/[id]/page.tsx
  - src/app/admin/categories/page.tsx
  - src/app/create-perfume/success/success-content.tsx
autonomous: true

must_haves:
  truths:
    - "Product search queries are sanitized against PostgREST injection"
    - "Cart validation and webhook operations use batch queries (no N+1)"
    - "API routes have appropriate maxDuration timeouts"
    - "Heartbeat endpoint has rate limiting"
    - "Bare .env file is gitignored"
    - "Production code uses Sentry breadcrumbs instead of console.log"
  artifacts:
    - path: "src/lib/supabase/product-service.ts"
      provides: "Sanitized search query + batch getProductsByIds"
      exports: ["searchProducts", "getProductsByIds"]
    - path: "src/lib/rate-limit.ts"
      provides: "Heartbeat rate limiter configuration"
      contains: "heartbeat"
    - path: ".gitignore"
      provides: "Bare .env entry"
      contains: ".env"
  key_links:
    - from: "src/lib/validation/cart.ts"
      to: "getProductsByIds"
      via: "batch query"
      pattern: "getProductsByIds"
    - from: "src/app/api/webhooks/stripe/route.ts"
      to: "getProductsByIds"
      via: "batch query"
      pattern: "getProductsByIds"
    - from: "src/app/api/heartbeat/route.ts"
      to: "checkRateLimit"
      via: "rate limiter"
      pattern: "checkRateLimit.*heartbeat"
---

<objective>
Fix all 6 critical audit findings: SQL injection, N+1 queries, missing timeouts, heartbeat auth, gitignore gap, and console.log cleanup.

Purpose: Eliminate security vulnerabilities, improve performance, and clean up production code quality.
Output: Secured, optimized, production-ready API routes and data access layer.
</objective>

<execution_context>
@/home/qualia/.claude/get-shit-done/workflows/execute-plan.md
@/home/qualia/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@CLAUDE.md

**Stack:** Next.js 14, TypeScript, Supabase, Stripe, Vercel
**Context:** v1.0 milestone complete, addressing post-audit findings
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix SQL injection and add batch query function</name>
  <files>src/lib/supabase/product-service.ts</files>
  <action>
**1.1 Fix SQL injection in searchProducts (line 129):**
- Replace direct string interpolation with sanitized query
- Escape PostgREST special characters: `%`, `_`, `*`, `(`, `)`, `[`, `]`, `!`, `,`
- Use `.ilike()` method with escaped wildcards: `.ilike('name', `%${escapedQuery}%`)`
- Apply same pattern to description and brand fields
- Keep existing `.eq('is_active', true)` filter

**1.2 Create batch query function:**
```typescript
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .in('id', ids);

  if (error) {
    // Use Sentry breadcrumb instead of console.error
    return [];
  }

  return data || [];
}
```
Export this function for use by cart validation and webhook.

**1.3 Console.log cleanup in this file:**
- Replace all 7 `console.error()` calls with Sentry breadcrumbs:
  ```typescript
  import * as Sentry from '@sentry/nextjs';

  Sentry.addBreadcrumb({
    category: 'product-service',
    message: 'Error description',
    level: 'error',
    data: { error }
  });
  ```
</action>
  <verify>
- `npm run type-check` passes
- Grep confirms no SQL injection pattern: `grep -n "\.or(\`.*\${" src/lib/supabase/product-service.ts` returns empty
- Grep confirms getProductsByIds exists: `grep -n "export.*getProductsByIds" src/lib/supabase/product-service.ts` returns match
- Grep confirms no console.error: `grep -n "console\." src/lib/supabase/product-service.ts` returns empty
  </verify>
  <done>searchProducts sanitizes query input, getProductsByIds function exists and exported, no console statements remain</done>
</task>

<task type="auto">
  <name>Task 2: Replace N+1 queries with batch queries</name>
  <files>src/lib/validation/cart.ts, src/app/api/webhooks/stripe/route.ts</files>
  <action>
**2.1 Fix N+1 in cart.ts (lines 48-89):**
- Import `getProductsByIds` from `@/lib/supabase/product-service`
- Extract all product IDs from cart items: `const productIds = items.map(item => item.product_id)`
- Call once: `const products = await getProductsByIds(productIds)`
- Create lookup map: `const productMap = new Map(products.map(p => [p.id, p]))`
- In validation loop, use: `const product = productMap.get(item.product_id)`
- Replace console.error with Sentry breadcrumb

**2.2 Fix N+1 in webhook route.ts (lines 403-413):**
- Find the section reconstructing cart items from metadata
- Extract product IDs: `const productIds = cartMetadata.map(item => item.pid)`
- Call once: `const products = await getProductsByIds(productIds)`
- Create lookup map: `const productMap = new Map(products.map(p => [p.id, p]))`
- Replace loop's `getProductById(item.pid)` with: `productMap.get(item.pid)`
- Replace 3 console.log calls with Sentry breadcrumbs (category: 'stripe-webhook')
  </action>
  <verify>
- `npm run type-check` passes
- Grep confirms no getProductById in loops:
  - `grep -A 5 "for.*cartMetadata" src/app/api/webhooks/stripe/route.ts | grep "getProductById"` returns empty
  - `grep -A 5 "for.*items" src/lib/validation/cart.ts | grep "getProductById"` returns empty
- Grep confirms getProductsByIds is imported in both files:
  - `grep "import.*getProductsByIds" src/lib/validation/cart.ts` returns match
  - `grep "import.*getProductsByIds" src/app/api/webhooks/stripe/route.ts` returns match
  </verify>
  <done>Both files use batch queries via getProductsByIds, no N+1 patterns remain</done>
</task>

<task type="auto">
  <name>Task 3: Add maxDuration to API routes</name>
  <files>
    src/app/api/webhooks/stripe/route.ts,
    src/app/api/ai-assistant/route.ts,
    src/app/api/contact/route.ts,
    src/app/api/checkout/route.ts,
    src/app/api/create-perfume/payment/route.ts,
    src/app/api/checkout/session-details/route.ts,
    src/app/api/admin/orders/route.ts,
    src/app/api/blog/route.ts,
    src/app/api/blog/[slug]/route.ts
  </files>
  <action>
Add `export const maxDuration` to each route file's top level (after imports, before handler functions):

- **webhooks/stripe/route.ts:** `export const maxDuration = 30;` (DB writes + email)
- **ai-assistant/route.ts:** `export const maxDuration = 30;` (OpenRouter API call)
- **contact/route.ts:** `export const maxDuration = 10;` (email send)
- **checkout/route.ts:** `export const maxDuration = 10;` (Stripe session)
- **create-perfume/payment/route.ts:** `export const maxDuration = 10;` (Stripe session)
- **checkout/session-details/route.ts:** `export const maxDuration = 10;` (Stripe retrieve)
- **admin/orders/route.ts:** `export const maxDuration = 10;` (DB ops)
- **blog/route.ts:** `export const maxDuration = 10;` (DB ops)
- **blog/[slug]/route.ts:** `export const maxDuration = 10;` (DB ops)

Place after imports, before any handler function (GET/POST/etc).
  </action>
  <verify>
- `npm run type-check` passes
- Grep confirms all routes have maxDuration:
  ```bash
  for route in webhooks/stripe ai-assistant contact checkout create-perfume/payment checkout/session-details admin/orders blog; do
    grep -n "export const maxDuration" src/app/api/$route/route.ts || echo "MISSING: $route"
  done
  ```
  All should return matches, none should show MISSING.
  </verify>
  <done>All 9 API routes have appropriate maxDuration exports</done>
</task>

<task type="auto">
  <name>Task 4: Add heartbeat rate limiting</name>
  <files>src/lib/rate-limit.ts, src/app/api/heartbeat/route.ts</files>
  <action>
**4.1 Add heartbeat limiter to rate-limit.ts:**
- Find existing limiters object (checkout, payment, etc.)
- Add new entry:
  ```typescript
  heartbeat: {
    requests: 30,
    window: 60, // 30 req/min
  },
  ```

**4.2 Apply rate limiting in heartbeat route:**
- Import `checkRateLimit` from `@/lib/rate-limit`
- At top of GET handler, before any logic:
  ```typescript
  const rateLimitResult = await checkRateLimit(request, 'heartbeat');
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: rateLimitResult.headers }
    );
  }
  ```
- Keep existing admin client logic
  </action>
  <verify>
- `npm run type-check` passes
- Grep confirms heartbeat limiter exists: `grep -n "heartbeat:" src/lib/rate-limit.ts` returns match
- Grep confirms rate limit applied: `grep -n "checkRateLimit.*heartbeat" src/app/api/heartbeat/route.ts` returns match
- Test: `curl -I http://localhost:3000/api/heartbeat` (after `npm run dev`) returns 200, then rapid requests return 429
  </verify>
  <done>Heartbeat endpoint has 30 req/min rate limiting</done>
</task>

<task type="auto">
  <name>Task 5: Add .env to .gitignore</name>
  <files>.gitignore</files>
  <action>
Add bare `.env` entry to the "local env files" section (after line 28):

```
# local env files
.env
.env*.local
.env.stripe
.env.vercel
.env.working
.stripe_key
```

Place it as the first entry in that section for clarity (most general pattern first).
  </action>
  <verify>
- `grep -n "^\.env$" .gitignore` returns match on line 29 (right after comment)
- `git status` should not show `.env` if it exists in working directory
  </verify>
  <done>.env file is ignored by git</done>
</task>

<task type="auto">
  <name>Task 6: Replace console.log with Sentry breadcrumbs</name>
  <files>
    src/components/cart/CheckoutButton.tsx,
    src/components/cart/CartProvider.tsx,
    src/components/ai/ChatWidget.tsx,
    src/app/api/checkout/session-details/route.ts,
    src/app/checkout/success/page.tsx,
    src/app/sitemap.ts,
    src/app/admin/page.tsx,
    src/app/admin/error.tsx,
    src/app/admin/products/page.tsx,
    src/app/admin/products/[id]/page.tsx,
    src/app/admin/categories/page.tsx,
    src/app/create-perfume/success/success-content.tsx
  </files>
  <action>
For each file with console.* statements:

**Import Sentry at top (if not already):**
```typescript
import * as Sentry from '@sentry/nextjs';
```

**Replace patterns:**

1. **console.error** → Sentry breadcrumb:
   ```typescript
   Sentry.addBreadcrumb({
     category: 'component-name', // e.g., 'checkout-button', 'cart-provider'
     message: 'Error description',
     level: 'error',
     data: { error }
   });
   ```

2. **console.log** → Remove entirely (these are debug statements in webhook, not needed in production)

3. **console.warn** → Sentry breadcrumb with `level: 'warning'`

**File-specific categories:**
- CheckoutButton.tsx → 'checkout-button'
- CartProvider.tsx → 'cart-provider'
- ChatWidget.tsx → 'chat-widget'
- session-details/route.ts → 'checkout-session'
- success/page.tsx → 'checkout-success'
- sitemap.ts → 'sitemap'
- admin/page.tsx → 'admin-dashboard'
- admin/error.tsx → 'admin-error'
- admin/products → 'admin-products'
- admin/categories → 'admin-categories'
- create-perfume/success → 'perfume-success'

Do NOT add breadcrumbs to files already fixed in Tasks 1-2 (product-service.ts, webhook route.ts, cart.ts).
  </action>
  <verify>
- `npm run type-check` passes
- Grep confirms no console statements remain in source files:
  ```bash
  grep -r "console\.\(log\|error\|warn\)" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".next"
  ```
  Should return empty (or only test files/comments).
- Grep confirms Sentry breadcrumbs exist: `grep -r "Sentry.addBreadcrumb" src/ | wc -l` returns ~14+ matches
  </verify>
  <done>All console.* statements replaced with Sentry breadcrumbs or removed</done>
</task>

</tasks>

<verification>
**Overall checks:**

1. **Security:** No SQL injection patterns in codebase
   ```bash
   grep -rn "\.or(\`.*\${" src/lib/
   ```

2. **Performance:** No N+1 query patterns
   ```bash
   grep -rn "await.*getProductById" src/lib/validation/ src/app/api/webhooks/
   ```

3. **Reliability:** All API routes have maxDuration
   ```bash
   grep -rn "export const maxDuration" src/app/api/ | wc -l
   ```
   Should return 9+

4. **Rate limiting:** Heartbeat protected
   ```bash
   curl -s http://localhost:3000/api/heartbeat && echo "OK"
   ```

5. **Git hygiene:** .env ignored
   ```bash
   grep "^\.env$" .gitignore
   ```

6. **Code quality:** No console statements
   ```bash
   grep -r "console\." src/ --include="*.ts" --include="*.tsx" | grep -v test | wc -l
   ```
   Should return 0
</verification>

<success_criteria>
- [ ] searchProducts sanitizes query input (no SQL injection)
- [ ] getProductsByIds batch function exists and is used in cart.ts and webhook route
- [ ] All 9 API routes have maxDuration exports
- [ ] Heartbeat endpoint has rate limiting (30 req/min)
- [ ] .env is in .gitignore
- [ ] All console.log/error/warn replaced with Sentry breadcrumbs or removed
- [ ] `npm run type-check` passes
- [ ] All grep verification commands return expected results
</success_criteria>

<output>
After completion, create `.planning/quick/1-fix-all-6-audit-findings-sql-injection-n/1-SUMMARY.md`
</output>
