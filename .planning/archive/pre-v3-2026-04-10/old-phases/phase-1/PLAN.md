# Phase 1: Security Fixes — Execution Plan

## Goal
Eliminate all security vulnerabilities found in the 2026-02-28 audit: XSS, hardcoded secrets, PII leaks, gitignore gaps.

## Pre-conditions
- Build currently passes clean (`npm run build` ✓)
- `dompurify` already installed (v3.3.1) and used in `RichDescription.tsx`
- Must work on a feature branch (per CLAUDE.md rules)

## Branch
`fix/phase-1-security-fixes`

---

## Task 1: XSS Fix in BlogContent

**File:** `src/components/blog/BlogContent.tsx`
**Issue:** Raw HTML rendered via `dangerouslySetInnerHTML` without sanitization
**Pattern:** Copy the DOMPurify pattern from `src/components/products/RichDescription.tsx`

**Changes:**
```tsx
// Before (line 11):
dangerouslySetInnerHTML={{ __html: content }}

// After:
import { useMemo } from 'react';
import DOMPurify from 'dompurify';

// Inside component:
const sanitized = useMemo(() => DOMPurify.sanitize(content), [content]);
dangerouslySetInnerHTML={{ __html: sanitized }}
```

**Verification:** `grep -n "dangerouslySetInnerHTML" src/components/blog/BlogContent.tsx` should show DOMPurify.sanitize wrapping the content.

---

## Task 2: Hardcoded Admin Setup Key

**File:** `src/app/api/admin/setup/route.ts`
**Issue:** `'aquador-setup-2024'` hardcoded on lines 19 and 74
**Fix:** Replace with `process.env.ADMIN_SETUP_KEY`

**Changes:**
1. Replace both occurrences of `setupKey !== 'aquador-setup-2024'` with:
   ```ts
   const expectedKey = process.env.ADMIN_SETUP_KEY;
   if (!expectedKey || setupKey !== expectedKey) {
   ```
2. Extract the check to avoid duplication — add a helper at the top of the file:
   ```ts
   function validateSetupKey(setupKey: string): boolean {
     const expected = process.env.ADMIN_SETUP_KEY;
     return !!expected && setupKey === expected;
   }
   ```
3. Use `validateSetupKey(setupKey)` in both POST and PUT handlers.

**Also update:** Add `ADMIN_SETUP_KEY` to `.env.example` (note: file is access-restricted, will need to create or append if accessible at a different path, or add to project README/docs).

**Verification:** `grep -rn "aquador-setup-2024" src/` should return zero results.

---

## Task 3: Strip PII from Stripe Webhook Logs

**File:** `src/app/api/webhooks/stripe/route.ts`
**Issue:** Customer emails logged in plaintext at lines 121, 259, 305, 371

**Specific lines to fix:**

1. **Line 121** — `console.log('Order persisted for:', customerEmail);`
   → Change to: `console.log('Order persisted for session:', session.id);`

2. **Line 259** — `console.log('Order confirmation email sent to:', customerEmail);`
   → Change to: `console.log('Order confirmation email sent for session:', orderDetails.sessionId);`

3. **Line 305** — `console.log('Order completed:', { ... customerEmail ... });`
   → Remove `customerEmail` from the logged object. Keep `sessionId`, `amountTotal`, `currency`.

4. **Line 250** — `console.error('Failed to send order confirmation email:', errorData);`
   → Keep as-is (errorData from Resend API, not PII) but verify it doesn't contain email in practice.

**Verification:** `grep -n "customerEmail" src/app/api/webhooks/stripe/route.ts` should only appear in logic, never inside `console.log` or `console.error` calls.

---

## Task 4: Gitignore Gaps

**File:** `.gitignore`
**Issue:** Sensitive files not covered: `.env.stripe`, `.env.vercel`, `.env.working`, `.stripe_key`

**Changes:** Append to `.gitignore`:
```
# sensitive env files
.env.stripe
.env.vercel
.env.working
.stripe_key
```

**Note:** The existing `.env*.local` pattern doesn't catch these because they don't end in `.local`. A broader `.env*` pattern would catch them but could be too aggressive (would catch `.env.example`). Adding explicit entries is safer.

**Verification:** `git check-ignore .env.stripe .env.vercel .env.working .stripe_key` should list all four files.

---

## Execution Order
1. Create branch `fix/phase-1-security-fixes` from `main`
2. Task 4 (Gitignore) — quickest, zero risk
3. Task 1 (XSS Fix) — small, established pattern exists
4. Task 2 (Hardcoded Key) — small refactor
5. Task 3 (PII Logs) — multiple lines, needs careful review
6. Run quality gates: `npx tsc --noEmit && npx eslint src/ && npm run build`
7. Atomic commit per task (config: `commit_strategy: atomic_per_issue`)

## Exit Criteria
- [ ] Zero `dangerouslySetInnerHTML` without DOMPurify sanitization
- [ ] No hardcoded secrets in source code (`grep -rn "aquador-setup" src/` = 0 results)
- [ ] No PII (customer emails) in `console.log`/`console.error` calls in webhook handler
- [ ] All sensitive env files covered by `.gitignore`
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes
