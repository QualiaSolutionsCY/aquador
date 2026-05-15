---
phase: 1
type: gap-closure
goal: "Close 2 in-scope gaps from phase-1-verification.md so Phase 1 moves FAIL → PASS without re-touching the 5 already-shipped tasks"
tasks: 2
waves: 1
gaps_closed: [Gap-A, Gap-D]
---

# Phase 1 Gaps — Admin Security & Reset (Closure Round)

**Goal:** Land the two corrections identified in `.planning/phase-1-verification.md ## Phase 1 Gap List` so all five Phase 1 ROADMAP success criteria pass with no critical or medium open findings.

**Why this round:** First-round verification surfaced two defects the contract-level check missed:
- Gap-A (CRITICAL): `live_chat_sessions` RLS predicate is structurally unreachable — no client sets `x-session-id` header, so policies fail closed and brick live-chat on migration apply.
- Gap-D (MEDIUM): `site_visitors_update_anon` policy uses `USING (true) WITH CHECK (true)`, allowing any anon caller to overwrite any visitor row by guessing the session_id (analytics tampering vector).

Both touch the staged, **not-yet-applied** Phase 1 migrations. We edit migration bodies in place rather than layering a new dated migration. No frontend touched.

---

## Task 1 — Gap-A: Rewrite live_chat_sessions RLS to delegate ownership to the route layer

**Wave:** 1
**Persona:** security
**Files:**
- `supabase/migrations/20260515000001_live_chat_sessions_rls.sql` (overwrite body in place — keep filename)
- `docs/RUNBOOK.md` (edit `## Live Chat RLS` section, lines ~29-41, in place)

**Depends on:** none (disjoint from Task 2's files)

**Why:** The shipped migration's predicate `id::text = current_setting('request.header.x-session-id', true)` is unreachable: `src/lib/supabase/public.ts:6-12` constructs a vanilla supabase-js client with no header injection, and `grep -rn "x-session-id" src/` returns only the migration file itself. PostgREST never receives the header, `current_setting(...)` returns NULL, `<uuid>::text = NULL` is NULL, RLS treats NULL as DENY, every live-chat call fails closed → live-chat is dead on apply. Per the verification file's recommendation (Option 1), the fix is to make RLS the coarse gate (`USING (true)` for SELECT/INSERT, `USING (false)` for UPDATE) and let the server-side route at `src/app/api/live-chat/notify/route.ts:102` (which already filters `.eq('id', sessionId).eq('status', 'waiting')`) enforce business-rule ownership. Acceptable because `live_chat_sessions` carries no PII or financial data — only `id`, `status`, `visitor_id`, `visitor_name`, `admin_id`, timestamps — and writes flow exclusively through one server route.

**Acceptance Criteria:**
- Migration enables RLS on `public.live_chat_sessions` and creates exactly three idempotent named policies for the `anon` role: `live_chat_sessions_select_anon` (FOR SELECT, USING (true)), `live_chat_sessions_insert_anon` (FOR INSERT, WITH CHECK (true)), `live_chat_sessions_update_anon` (FOR UPDATE, USING (false), WITH CHECK (false)).
- No occurrence of `current_setting` or `x-session-id` anywhere in the migration after the rewrite.
- Each policy is wrapped in a `DO $$ ... IF NOT EXISTS ... CREATE POLICY ... END $$;` idempotency guard matching the style of the heartbeat migration.
- `docs/RUNBOOK.md ## Live Chat RLS` section is rewritten in place to reflect the new policy names and semantics: SELECT/INSERT permitted to anon, UPDATE denied to anon at the DB layer, and the server-side notify route is documented as the ownership gate (with explicit reference to `src/app/api/live-chat/notify/route.ts` and the `.eq('id', sessionId).eq('status', 'waiting')` filter). The runbook explicitly states why this is acceptable (no PII on table, single-route write surface).
- The RUNBOOK no longer claims clients must forward an `x-session-id` header.
- The migration filename stays `20260515000001_live_chat_sessions_rls.sql` (overwrite contents only).

**Action:**
1. Open `supabase/migrations/20260515000001_live_chat_sessions_rls.sql` and replace its full body with:
   - Header comment block citing SEC-04 + this gap-closure round and explaining the design choice (route-layer ownership; RLS as coarse gate).
   - `alter table public.live_chat_sessions enable row level security;`
   - Three `DO $$ ... END $$;` blocks, one per policy. Each block checks `pg_policies` for the policy name+tablename, then `EXECUTE` a `CREATE POLICY` statement.
     - `live_chat_sessions_select_anon` — `FOR SELECT TO anon USING (true)`.
     - `live_chat_sessions_insert_anon` — `FOR INSERT TO anon WITH CHECK (true)`.
     - `live_chat_sessions_update_anon` — `FOR UPDATE TO anon USING (false) WITH CHECK (false)`.
   - Do NOT include any `current_setting` call, any header reference, or any reference to a non-existent `session_id` column.
2. Open `docs/RUNBOOK.md` and rewrite the `## Live Chat RLS` section (currently lines 29-41) in place. Keep section heading. New content must:
   - Reference the migration filename `supabase/migrations/20260515000001_live_chat_sessions_rls.sql`.
   - Name the three new policies (`_select_anon`, `_insert_anon`, `_update_anon`) and state their semantics: anon may SELECT and INSERT freely, anon may NOT UPDATE.
   - State that ownership enforcement lives in the server route at `src/app/api/live-chat/notify/route.ts` via `.eq('id', sessionId).eq('status', 'waiting').single()`, and that all live-chat writes must continue to flow through `createPublicClient` + a server route (never `createAdminClient`).
   - Explain the acceptable-tradeoff rationale: `live_chat_sessions` has no PII or financial fields (columns: `id, status, visitor_id, visitor_name, admin_id, created_at, closed_at, updated_at`); the single-route choke point is the auditable boundary.
   - Remove the old paragraph claiming clients must forward `x-session-id`. The header is no longer used.
   - Keep the "edit migration in place only before apply; after apply, write a new migration" guidance unchanged.
3. Do NOT apply the migration to remote. The original Phase 1 rule (`/qualia-ship` handles apply) still stands.
4. Do NOT touch `src/app/api/live-chat/notify/route.ts` — its existing `.eq('id', sessionId).eq('status', 'waiting').single()` is the gate this design relies on; verify it visually but make no code change.

**Validation:** (builder self-check, copy-pasteable)
- `grep -cE "_select_anon|_insert_anon|_update_anon" supabase/migrations/20260515000001_live_chat_sessions_rls.sql` → expected `≥ 3` (one occurrence of each policy name minimum, more if referenced in `pg_policies` guards).
- `grep -cE "current_setting|x-session-id" supabase/migrations/20260515000001_live_chat_sessions_rls.sql` → expected `0`.
- `grep -c "using (false)" supabase/migrations/20260515000001_live_chat_sessions_rls.sql` → expected `≥ 1` (the UPDATE policy).
- `grep -c "Live Chat RLS" docs/RUNBOOK.md` → expected `1` (section header preserved).
- `grep -cE "x-session-id" docs/RUNBOOK.md` → expected `0` (old header contract removed).
- `grep -cE "_select_anon|_insert_anon|_update_anon" docs/RUNBOOK.md` → expected `≥ 3`.

**Context:** Read
- `@.planning/phase-1-verification.md` (Gap 1 specification, Finding A evidence)
- `@supabase/migrations/20260515000001_live_chat_sessions_rls.sql` (current body to overwrite)
- `@docs/RUNBOOK.md` (current `## Live Chat RLS` section to rewrite, lines 29-41)
- `@supabase/migrations/20260515000000_heartbeat_pg_cron_cleanup.sql` (style reference for idempotent `DO $$ ... END $$;` policy blocks)
- `@src/lib/supabase/types.ts` (lines 378-409: confirm actual `live_chat_sessions` column set)
- `@src/app/api/live-chat/notify/route.ts` (lines 97-110: confirm the route-layer filter — do not modify)
- `@src/lib/supabase/public.ts` (confirm no header injection — do not modify)

---

## Task 2 — Gap-D: Convert heartbeat to insert-only and drop the unbounded UPDATE policy

**Wave:** 1
**Persona:** security
**Files:**
- `src/app/api/heartbeat/route.ts` (replace `.upsert(...)` call at lines 43-53 with `.insert(...)`)
- `src/app/api/heartbeat/__tests__/route.test.ts` (rename `mockSupabaseUpsert` → `mockSupabaseInsert`, update method mocks and assertions)
- `supabase/migrations/20260515000000_heartbeat_pg_cron_cleanup.sql` (remove the `site_visitors_update_anon` policy block at lines 39-49 and update the header comment)

**Depends on:** none (disjoint from Task 1's files)

**Why:** The shipped UPDATE policy `USING (true) WITH CHECK (true)` allows any anon caller who knows or guesses another visitor's `session_id` to overwrite that row's `page`, `ip_hash`, `user_agent`, `country` — an analytics tampering vector. The fix per the verification file is to drop UPDATE entirely: switch the route to pure INSERT, let multiple INSERTs per session become benign churn, and rely on the existing pg_cron job (`*/5 * * * *`, deletes rows older than 10 minutes) to sweep duplicates. pg_cron runs at DB level outside RLS so cleanup continues unaffected. Anon RLS becomes: INSERT only — no UPDATE, no SELECT, no DELETE.

**Acceptance Criteria:**
- `src/app/api/heartbeat/route.ts` no longer contains any `.upsert(` call. The site_visitors write is a plain `.insert({ session_id, page, user_agent, country, ip_hash, last_seen })` with no `onConflict` argument.
- The inline comment on the route's write call is updated to reflect insert-only semantics + pg_cron dedup (one line, no marketing fluff).
- `src/app/api/heartbeat/__tests__/route.test.ts` no longer asserts `.toHaveBeenCalledWith(..., { onConflict: 'session_id' })` and no longer references `mockSupabaseUpsert`; all assertions check `mockSupabaseInsert` (or equivalently renamed mock) being called with the insert payload object only (no second arg).
- All 10 heartbeat tests still pass after edits.
- `supabase/migrations/20260515000000_heartbeat_pg_cron_cleanup.sql` no longer creates `site_visitors_update_anon`. The `DO $$ ... CREATE POLICY ... FOR UPDATE ... END $$;` block (currently lines 39-49) is removed. Only the `site_visitors_insert_anon` policy remains for anon. The pg_cron schedule block is untouched.
- The migration's header comment block is updated: drop the "INSERT/UPDATE" wording and replace with "INSERT only; multiple writes per session are benign churn that pg_cron sweeps". The note about `onConflict` requiring UPDATE policy is removed.
- Migration filename stays `20260515000000_heartbeat_pg_cron_cleanup.sql` (overwrite contents only).
- `npx tsc --noEmit` exits 0.

**Action:**
1. Edit `src/app/api/heartbeat/route.ts`:
   - Replace lines 42-53 (`// Upsert visitor ... )`) with:
     ```ts
     // SEC-02 + gap-D: pure INSERT (anon role has no UPDATE on site_visitors).
     // Multiple inserts per session are benign churn — pg_cron cleanup runs every 5m.
     await supabase.from('site_visitors').insert({
       session_id: sessionId,
       page: page || null,
       user_agent: userAgent,
       country,
       ip_hash: ipHash,
       last_seen: new Date().toISOString(),
     });
     ```
   - Do NOT change anything else in the file. Validation, IP hashing, error handling, rate-limit gating stay identical.
2. Edit `src/app/api/heartbeat/__tests__/route.test.ts`:
   - Rename `mockSupabaseUpsert` → `mockSupabaseInsert` everywhere it appears (declaration line 9, default mock setup, three assertions in Happy Path + Error Handling).
   - Update the `mockSupabaseFrom.mockImplementation` for `'site_visitors'` to expose `{ insert: mockSupabaseInsert }` instead of `{ upsert: mockSupabaseUpsert }`.
   - In the "should upsert visitor data" test (line 89): rename the test description to "should insert visitor data" and change the assertion to:
     ```ts
     expect(mockSupabaseInsert).toHaveBeenCalledWith(
       expect.objectContaining({
         session_id: 'sess_test_visitor',
         page: '/create-perfume',
       })
     );
     ```
     (no second argument).
   - Update `mockSupabaseInsert.mock.calls[0][0]` references in the IP-hash and user-agent/country tests (lines 114, 131) to remain `[0][0]` — payload is still the first call's first arg.
   - Update the comment block at lines 16-18 to drop the upsert reference: change "heartbeat now uses createPublicClient after SEC-02 removed the admin-client dependency. Stale-row cleanup is handled by pg_cron, so the route no longer calls .delete().lt(...)." to "heartbeat uses createPublicClient (SEC-02) and pure .insert (gap-D: no anon UPDATE on site_visitors). Stale-row cleanup runs in pg_cron."
3. Edit `supabase/migrations/20260515000000_heartbeat_pg_cron_cleanup.sql`:
   - Delete the entire `DO $$ ... site_visitors_update_anon ... END $$;` block currently at lines 39-49.
   - Update the file's header comment (lines 1-14) section "Purpose 1": change "by allowing the anon role to INSERT/UPDATE site_visitors" to "by allowing the anon role to INSERT into site_visitors".
   - Update the comment at lines 22-25 (the "Supabase's PostgREST translates .upsert..." paragraph): replace with a one-paragraph note: "The heartbeat route inserts only (gap-D). Multiple inserts per session are intentional — the pg_cron job below deletes rows older than 10 minutes, so duplicates self-prune. No UPDATE policy for anon."
   - Leave the `site_visitors_insert_anon` block (lines 27-37) and the pg_cron schedule block (lines 51-67) untouched.
4. Do NOT apply the migration to remote.

**Validation:** (builder self-check)
- `grep -c "\.upsert(" src/app/api/heartbeat/route.ts` → expected `0`.
- `grep -c "\.insert(" src/app/api/heartbeat/route.ts` → expected `1`.
- `grep -c "onConflict" src/app/api/heartbeat/route.ts` → expected `0`.
- `grep -c "site_visitors_update_anon" supabase/migrations/20260515000000_heartbeat_pg_cron_cleanup.sql` → expected `0`.
- `grep -c "site_visitors_insert_anon" supabase/migrations/20260515000000_heartbeat_pg_cron_cleanup.sql` → expected `≥ 1`.
- `grep -ciE "FOR UPDATE TO anon" supabase/migrations/20260515000000_heartbeat_pg_cron_cleanup.sql` → expected `0`.
- `grep -c "mockSupabaseUpsert" src/app/api/heartbeat/__tests__/route.test.ts` → expected `0`.
- `grep -c "mockSupabaseInsert" src/app/api/heartbeat/__tests__/route.test.ts` → expected `≥ 4` (declaration + 3 assertion sites).
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → expected `0`.
- `npm test -- src/app/api/heartbeat/__tests__/route.test.ts 2>&1 | grep -cE "Tests:[[:space:]]+10 passed"` → expected `1`.

**Context:** Read
- `@.planning/phase-1-verification.md` (Gap 2 specification, Finding D evidence)
- `@src/app/api/heartbeat/route.ts` (current upsert call at lines 42-53)
- `@src/app/api/heartbeat/__tests__/route.test.ts` (current upsert mock + assertions)
- `@supabase/migrations/20260515000000_heartbeat_pg_cron_cleanup.sql` (UPDATE policy block to delete, lines 39-49)

---

## Success Criteria

Re-asserts the affected Phase 1 ROADMAP criteria that the gap-closure round must move from at-risk/MEDIUM to fully PASS, plus the build gate.

- [ ] **Criterion 4 (live-chat RLS clean):** `live_chat_sessions` has RLS enabled with three policies named `*_select_anon`, `*_insert_anon`, `*_update_anon`. Predicates are reachable (no `current_setting` / `x-session-id` references). UPDATE is denied at the DB layer. RUNBOOK accurately documents the new semantics and the server-side ownership gate.
- [ ] **Criterion (new, gap-D): site_visitors anon access is INSERT-only.** No `FOR UPDATE TO anon` policy exists in the migration. The heartbeat route uses `.insert(...)` not `.upsert(...)`. pg_cron schedule block is intact and unchanged.
- [ ] **Criterion 5 (build & typecheck):** `npx tsc --noEmit` exits 0; `npm run build` exits 0; `npm test -- src/app/api/heartbeat` passes 10/10.
- [ ] **No regression on Criteria 1, 2, 3:** the previously-passing checks (admin setup → 404; sitemap via public adapter; heartbeat off service-role) remain untouched — gap tasks only edit the two staged migrations, one route file, and one test file.

---

## Verification Contract

### Contract for Task 1 — live_chat RLS rewrite (anon policies present)
**Check type:** grep-match
**Command:** `grep -cE "live_chat_sessions_(select|insert|update)_anon" supabase/migrations/20260515000001_live_chat_sessions_rls.sql`
**Expected:** `≥ 3` (each new policy name appears at least once)
**Fail if:** Returns `< 3` — one or more required policies missing.

### Contract for Task 1 — live_chat RLS rewrite (header-based predicate eliminated)
**Check type:** grep-match
**Command:** `grep -cE "current_setting|x-session-id" supabase/migrations/20260515000001_live_chat_sessions_rls.sql`
**Expected:** `0`
**Fail if:** Returns `> 0` — old unreachable predicate still present, Gap-A unfixed.

### Contract for Task 1 — UPDATE denied at DB layer
**Check type:** grep-match
**Command:** `grep -cE "for update[[:space:]]+to[[:space:]]+anon[[:space:]]+using[[:space:]]*\(false\)" supabase/migrations/20260515000001_live_chat_sessions_rls.sql`
**Expected:** `≥ 1`
**Fail if:** Returns `0` — UPDATE policy is not explicitly denying anon.

### Contract for Task 1 — RUNBOOK section updated
**Check type:** grep-match
**Command:** `grep -cE "_select_anon|_insert_anon|_update_anon" docs/RUNBOOK.md`
**Expected:** `≥ 3`
**Fail if:** Returns `< 3` — RUNBOOK still references old policy names or didn't update.

### Contract for Task 1 — RUNBOOK no longer claims x-session-id header
**Check type:** grep-match
**Command:** `grep -cE "x-session-id" docs/RUNBOOK.md`
**Expected:** `0`
**Fail if:** Returns `> 0` — stale header contract still documented.

### Contract for Task 1 — Notify route untouched (wiring preserved)
**Check type:** grep-match
**Command:** `grep -cE "\.eq\('id', sessionId\)" src/app/api/live-chat/notify/route.ts`
**Expected:** `≥ 1`
**Fail if:** Returns `0` — the route-layer ownership filter the new RLS depends on has been disturbed.

### Contract for Task 2 — Heartbeat is insert-only
**Check type:** grep-match
**Command:** `grep -c "\.upsert(" src/app/api/heartbeat/route.ts`
**Expected:** `0`
**Fail if:** Returns `> 0` — upsert still present, Gap-D unfixed.

### Contract for Task 2 — Heartbeat insert call wired
**Check type:** grep-match
**Command:** `grep -cE "\.from\('site_visitors'\)\.insert\(" src/app/api/heartbeat/route.ts`
**Expected:** `1`
**Fail if:** Returns `0` — the write call was removed without replacement, or the chain shape changed.

### Contract for Task 2 — No onConflict argument lingering
**Check type:** grep-match
**Command:** `grep -c "onConflict" src/app/api/heartbeat/route.ts`
**Expected:** `0`
**Fail if:** Returns `> 0` — leftover upsert option, indicates partial edit.

### Contract for Task 2 — UPDATE policy removed from migration
**Check type:** grep-match
**Command:** `grep -cE "site_visitors_update_anon|FOR UPDATE TO anon" supabase/migrations/20260515000000_heartbeat_pg_cron_cleanup.sql`
**Expected:** `0`
**Fail if:** Returns `> 0` — unbounded UPDATE policy still present, Gap-D unfixed.

### Contract for Task 2 — INSERT policy preserved
**Check type:** grep-match
**Command:** `grep -c "site_visitors_insert_anon" supabase/migrations/20260515000000_heartbeat_pg_cron_cleanup.sql`
**Expected:** `≥ 1`
**Fail if:** Returns `0` — the INSERT policy that allows heartbeat writes was accidentally removed.

### Contract for Task 2 — pg_cron schedule untouched
**Check type:** grep-match
**Command:** `grep -cE "cron\.schedule\(\s*'heartbeat-cleanup'" supabase/migrations/20260515000000_heartbeat_pg_cron_cleanup.sql`
**Expected:** `1`
**Fail if:** Returns `0` — cron job lost during edit; stale-row cleanup is broken.

### Contract for Task 2 — Test file updated (no upsert mock)
**Check type:** grep-match
**Command:** `grep -c "mockSupabaseUpsert" src/app/api/heartbeat/__tests__/route.test.ts`
**Expected:** `0`
**Fail if:** Returns `> 0` — test still mocks upsert; will silently fail to exercise the new code path.

### Contract for Task 2 — Test file references insert mock
**Check type:** grep-match
**Command:** `grep -c "mockSupabaseInsert" src/app/api/heartbeat/__tests__/route.test.ts`
**Expected:** `≥ 4`
**Fail if:** Returns `< 4` — incomplete rename (declaration + at least 3 assertion call sites expected).

### Contract for Task 2 — Heartbeat tests pass
**Check type:** command-exit
**Command:** `npm test -- src/app/api/heartbeat/__tests__/route.test.ts 2>&1 | grep -cE "Tests:[[:space:]]+10 passed"`
**Expected:** `1`
**Fail if:** Returns `0` — one or more heartbeat tests failing after the upsert→insert migration.

### Contract for Both Tasks — TypeScript clean
**Check type:** command-exit
**Command:** `npx tsc --noEmit 2>&1 | grep -c "error TS"`
**Expected:** `0`
**Fail if:** Returns `> 0` — any TypeScript error introduced by the edits.

### Contract for Both Tasks — Build clean
**Check type:** command-exit
**Command:** `npm run build 2>&1 | grep -cE "Compiled successfully|✓ Compiled"`
**Expected:** `≥ 1`
**Fail if:** Returns `0` — build broke. (Drops the `tail -30` of the original phase contract; per the verification file's contract-wording gap, the build succeeds but the marker line falls earlier in stdout.)
