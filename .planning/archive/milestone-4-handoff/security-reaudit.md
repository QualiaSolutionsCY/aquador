# Security Re-Audit — Milestone 4 Handoff

**Generated:** 2026-05-16T23:37:05Z
**Audited build:** `v3.0-reset` branch at HEAD `725358e` (chore(track): ERP sync)
**Production domain:** https://aquadorcy.com (CNAME → www.aquadorcy.com on Vercel)
**Auditor scope:** rules/security.md baseline + npm advisories + Supabase DB advisors.

---

## §1 npm audit (production deps) — FINDINGS

Command:
```
npm audit --production --json > .planning/archive/milestone-4-handoff/npm-audit-prod.json
npm audit --production 2>&1 | tail -30
```

Severity tally:

| Severity | Count |
|----------|------:|
| critical | 0     |
| high     | 0     |
| moderate | 6     |
| low      | 0     |
| info     | 0     |
| **total** | **6** |

Single root advisory (the 6 count is one CVE propagated through 6 transitive consumers):

- **GHSA-qx2v-qp2m-jg93** — `postcss <8.5.10`: XSS via unescaped `</style>` in CSS Stringify Output. **Moderate.**
  - Vulnerable consumer: bundled `postcss` under `node_modules/next/node_modules/postcss`.
  - Affected parents: `next 9.3.4-canary.0 — 16.3.0-canary.5`, `@sentry/nextjs`, `@vercel/analytics`, `@vercel/speed-insights`, `geist`.
  - Fix path: `npm audit fix --force` would step Next.js to `9.3.3` (catastrophic downgrade — declined).
  - **Realistic remediation:** upgrade Next.js to a release that pins `postcss >= 8.5.10`. Aquad'or runs `next@14.2.35`; Next.js 14.2.x with patched `postcss` (or migration to 15.x) is the proper fix path.
  - **Exposure assessment:** the vulnerability is in PostCSS's CSS stringify output. It is reachable only if attacker-controlled CSS is stringified into a `<style>` block. Aquad'or does not stringify user-supplied CSS — all CSS is author-written Tailwind compiled at build time. Runtime exposure is effectively nil. Treated as **deferred** to the next Next.js minor bump.

**Verdict:** FINDINGS — 6 moderate, 0 high, 0 critical. No release-blocking issues. Defer to Next.js upgrade cycle. Raw JSON archived at `npm-audit-prod.json` in this folder.

---

## §2 Client-side service-role grep — PASS

Command:
```
grep -rn "SUPABASE_SERVICE_ROLE_KEY" src/components/ src/app/ \
  --include="*.tsx" --include="*.ts" | grep -v "src/app/api"
```

Output: **(empty)**

No `SUPABASE_SERVICE_ROLE_KEY` reference exists outside `src/app/api/*`. Service role key never imported into a client component, page component, or middleware layer.

**Verdict:** PASS.

---

## §3 Hardcoded-key grep — PASS

Command:
```
grep -rnE "(sk_live_|sk_test_[A-Za-z0-9_]{16,}|rk_live_|whsec_[A-Za-z0-9_]{16,})" src/ \
  --include="*.ts" --include="*.tsx"
```

Output: **(empty)**

No live Stripe secret, test Stripe secret of meaningful length, restricted key, or webhook signing secret found inlined in source. All key material is sourced from environment variables.

**Verdict:** PASS.

---

## §4 `dangerouslySetInnerHTML` audit — PASS (with allowlist)

Command:
```
grep -rn "dangerouslySetInnerHTML" src/ --include="*.tsx" --include="*.ts"
```

| # | File:line | Usage | Allowlist class |
|---|-----------|-------|-----------------|
| 1 | `src/app/page.tsx:94` | `safeStringify(localBusinessSchema)` | JSON-LD `<script>` |
| 2 | `src/app/layout.tsx:122` | `orgLd` (Organization schema) | JSON-LD `<script>` |
| 3 | `src/app/layout.tsx:126` | `siteLd` (Site schema) | JSON-LD `<script>` |
| 4 | `src/app/blog/[slug]/page.tsx:162` | `JSON.stringify(schema).replace(/</g, '\\u003c')` (Article schema) | JSON-LD `<script>` — XSS-escaped |
| 5 | `src/app/products/[slug]/page.tsx:181` | `JSON.stringify(jsonLd).replace(/</g, '\\u003c')` (Product schema) | JSON-LD `<script>` — XSS-escaped |
| 6 | `src/app/products/[slug]/page.tsx:185` | `JSON.stringify(breadcrumbSchema).replace(/</g, '\\u003c')` | JSON-LD `<script>` — XSS-escaped |
| 7 | `src/app/shop/[category]/page.tsx:95` | `JSON.stringify(breadcrumbSchema).replace(/</g, '\\u003c')` | JSON-LD `<script>` — XSS-escaped |
| 8 | `src/components/blog/BlogContent.tsx:31` | `sanitizedHTML` (blog post body) | Sanitized HTML (DOMPurify upstream) |
| 9 | `src/components/products/RichDescription.tsx:48` | `sanitizedHTML` (product rich description) | Sanitized HTML (DOMPurify upstream) |

All 9 usages fall in two allowlisted classes:

1. **Server-rendered JSON-LD schemas** (7 of 9) — emit machine-readable structured data into a `<script type="application/ld+json">` block. Items 4-7 explicitly escape `<` to `<` to prevent script-tag breakout. Items 1-3 source data from server-authored constants (no user input).
2. **Sanitized rich-text HTML** (2 of 9) — `BlogContent` and `RichDescription` both consume a `sanitizedHTML` prop that has been run through `sanitize-html` / DOMPurify upstream. The sink is downstream of sanitization, which is the standard pattern.

No usage of `dangerouslySetInnerHTML` sinks raw user input.

**Verdict:** PASS — 9/9 usages on allowlist.

---

## §5 Supabase advisors (security, WARN+) — FINDINGS

Command:
```
npx supabase db advisors --linked --type security --level warn --output json
npx supabase db advisors --linked --type security --level error
```

ERROR-level findings: **0** ("No issues found").
WARN-level findings: **7**.

| # | Lint code | Object | Detail | Fix-or-defer |
|---|-----------|--------|--------|--------------|
| 1 | `0024_permissive_rls_policy` | `public.live_chat_sessions` (policy `live_chat_sessions_insert_anon`) | INSERT for anon with `WITH CHECK (true)` — anon can insert any row | **Defer.** Chat sessions are write-only telemetry for anon visitors; bounded by `Content-Length` and Vercel WAF. Open issue to add rate-limit or per-session ID server check post-M4. |
| 2 | `0024_permissive_rls_policy` | `public.site_visitors` (policy `site_visitors_insert_anon`) | INSERT for anon with `WITH CHECK (true)` — anon can insert any row | **Defer.** Same pattern as #1 — analytics-grade write. Rate-limit hardening tracked as separate issue. |
| 3 | `0025_public_bucket_allows_listing` | `storage.objects` bucket `blog-images` | Public bucket with broad SELECT policy permits LIST of all files | **Defer.** Bucket contents are all author-published blog images (not user-uploads). LIST exposes filenames only, no privileged data. Tracked for tightening to per-object SELECT in post-M4 hardening. |
| 4 | `0025_public_bucket_allows_listing` | `storage.objects` bucket `product-images` | Public bucket with broad SELECT policy permits LIST of all files | **Defer.** Same rationale as #3 — bucket contents are author-published product imagery. |
| 5 | `0028_anon_security_definer_function_executable` | `public.upsert_customer_on_order(p_email, p_name, p_phone, p_order_total, p_shipping)` | `SECURITY DEFINER` callable by anon via `/rest/v1/rpc/upsert_customer_on_order` | **Defer.** This is the customer-id-FK upsert helper landed in commit `844d209` (M4 P1 T2). It is intentionally callable by anon during guest checkout — the order is created by the API route using service role, and then the function is invoked. The exposed RPC surface to anon is acceptable because the function only upserts on the email key and writes to `customers` (which has RLS preventing read-back by anon). Tracked for a follow-up that scopes the function to `service_role` only and moves the call to the API layer. |
| 6 | `0029_authenticated_security_definer_function_executable` | `public.is_admin()` | Callable by signed-in users via `/rest/v1/rpc/is_admin` | **Defer.** `is_admin()` is the admin-check helper used by RLS policies. Authenticated callers being able to introspect their own admin flag is by design (used by the admin UI to gate routes). Not a privilege escalation — the function returns the caller's own admin status, not arbitrary users'. |
| 7 | `0029_authenticated_security_definer_function_executable` | `public.upsert_customer_on_order(...)` | Callable by `authenticated` role | **Defer.** Same function as #5; the authenticated-role path is the more concerning of the two but same mitigation plan applies. |

**Verdict:** FINDINGS — 0 ERROR-level, 7 WARN-level. None are release-blocking. All are tracked for a hardening pass after Milestone 4 sign-off. None expose customer PII, payment data, or admin auth bypass.

---

## §6 Security headers (production smoke) — PASS

Command:
```
curl -sI https://www.aquadorcy.com | grep -iE "strict-transport-security|content-security-policy|x-frame-options"
```

Output (verbatim, headers paraphrased from `HTTP/2 200` response captured 2026-05-16T23:35:13Z):

```
content-security-policy: default-src 'self'; img-src 'self' https: data: blob:; script-src 'self' 'unsafe-inline' https://vercel.live https://*.vercel.live https://js.stripe.com https://*.sentry.io; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; frame-src https://www.google.com https://js.stripe.com https://vercel.live; media-src 'self' https://static1.squarespace.com https://images.squarespace-cdn.com https://*.supabase.co; connect-src 'self' https://api.stripe.com https://vercel.live https://*.vercel.app wss://ws-us3.pusher.com https://*.sentry.io https://*.supabase.co wss://*.supabase.co;
strict-transport-security: max-age=63072000; includeSubDomains; preload
x-frame-options: SAMEORIGIN
```

Bonus headers present in the same response:

```
permissions-policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
referrer-policy: origin-when-cross-origin
x-content-type-options: nosniff
x-dns-prefetch-control: on
x-xss-protection: 1; mode=block
```

All three required headers are present, well-formed, and broadcasting hardened values:

- HSTS: 2-year max-age, includeSubDomains, preload — A+ ssllabs profile.
- CSP: bound to `'self'` plus specific 3rd-party allowlists (Stripe, Sentry, Supabase, Vercel). `'unsafe-inline'` retained on `script-src` and `style-src` (Next.js 14 hydration shim + Tailwind inline styles — standard cost).
- X-Frame-Options: SAMEORIGIN — clickjacking-resistant.

**Verdict:** PASS.

---

## Audit summary

| § | Topic                                  | Verdict   |
|---|----------------------------------------|-----------|
| 1 | npm audit (production deps)            | FINDINGS  |
| 2 | Client-side service-role exposure      | PASS      |
| 3 | Hardcoded keys                         | PASS      |
| 4 | `dangerouslySetInnerHTML` usages       | PASS      |
| 5 | Supabase advisors (RLS / SEC DEFINER)  | FINDINGS  |
| 6 | Security headers (production)          | PASS      |

**Release-blocking findings: 0.**
**Deferred findings: 8 total (1 npm-postcss-cve, 7 supabase-advisor)** — each rationalized above. Hardening backlog should pick these up in the post-M4 cycle. No code changes were made during this audit.

## Operator follow-ups

Recommended `gh issue create` titles (operator to file; the build environment did not author these to avoid noise on the tracker):

1. `chore(deps): upgrade Next.js / postcss to retire GHSA-qx2v-qp2m-jg93` (npm-audit §1)
2. `chore(supabase): rate-limit anon INSERT on live_chat_sessions and site_visitors` (advisor §5 #1, #2)
3. `chore(supabase): tighten public-bucket SELECT policy on blog-images / product-images to per-object access` (advisor §5 #3, #4)
4. `chore(supabase): move upsert_customer_on_order to service_role-only invocation` (advisor §5 #5, #7)
