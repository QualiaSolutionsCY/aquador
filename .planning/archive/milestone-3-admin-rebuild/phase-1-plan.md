---
phase: 1
goal: "Close the CRITICAL /api/admin/setup auth bypass and eliminate the two HIGH security smells (heartbeat service-role, sitemap direct SDK) plus audit live-chat RLS, before any new admin-facing work begins."
tasks: 5
waves: 2
---

# Phase 1: Admin Security & Reset

**Goal:** `/api/admin/setup` no longer accepts unauthenticated bootstrap; `/api/heartbeat` no longer touches the service-role key; `src/app/sitemap.ts` reaches Supabase only through the public adapter; `/api/live-chat/*` is confirmed RLS-clean (with policies added if missing); `npm run build` and `npx tsc --noEmit` both exit 0.

**Why this phase:** The codebase scan flagged one CRITICAL (`/api/admin/setup` env-flag auth bypass mints `super_admin`) and two HIGH severity items (`/api/heartbeat` service-role POST surface, `sitemap.ts` direct SDK import). M3 phases 3.2–3.4 build new authenticated admin surface on top of this foundation — shipping any of it before these holes close means inheriting an attack surface that already exists in production. This phase is the precondition for the rest of Milestone 3.

---

## Task 1 — Close `/api/admin/setup` bootstrap hole + write RUNBOOK (SEC-01, prep for SEC-04 doc)
**Wave:** 1
**Persona:** security
**Files:**
- `src/app/api/admin/setup/route.ts` — overwrite handler bodies with permanent 404 responses; remove all env-flag activation logic; delete imports of `createAdminClient` / `createClient` if they exist
- `docs/RUNBOOK.md` — new file documenting the Supabase Dashboard bootstrap procedure for first-admin creation AND the live-chat RLS policy reference (policy names are deterministic — defined in Task 4's migration spec; Task 1 writes the documentation that points to them so Task 4 never needs to touch RUNBOOK and Wave 1 stays write-disjoint)

**Depends on:** none

**Why:** SEC-01 — the existing `/api/admin/setup` route allows minting a `super_admin` row in `admin_users` when an env flag is set, with no per-request authentication. An attacker who finds the env flag (or guesses it during a misconfiguration window) gains permanent admin. Removing the env-flag activation path collapses the attack surface to zero. The runbook captures the manual Supabase Dashboard procedure so the operator never needs the route again. RUNBOOK ownership consolidates here so Wave 1 has no shared-file writes.

**Acceptance Criteria:**
- `GET /api/admin/setup` and `POST /api/admin/setup` both return HTTP 404 (or 405) with no body that reveals route internals — no env flag, header, or query string activates a successful response code on production.
- `src/app/api/admin/setup/route.ts` contains no import of `createAdminClient`, no reference to `SUPABASE_SERVICE_ROLE_KEY`, and no `INSERT` into `admin_users`.
- `docs/RUNBOOK.md` exists with two top-level sections: `## Bootstrapping an Admin User` and `## Live Chat RLS`. The latter names the three policies (`live_chat_sessions_select_owner`, `live_chat_sessions_insert_owner`, `live_chat_sessions_update_owner`) and points to migration `20260515000001_live_chat_sessions_rls.sql`.
- A precondition check confirms at least one row exists in `admin_users` before the route's bootstrap capability is removed — recorded in the commit message.

**Action:**
1. Before any code change, run the precondition check using the Supabase project ref `hznpuxplqgszbacxzbhv`: `npx supabase db remote query "select count(*) from admin_users;"` (or, if that CLI form is unavailable on this version, use the `mcp__supabase__execute_sql` tool with `select count(*) as n from admin_users;`). If the count is 0, HALT — surface a blocker to the user: "SEC-01 blocked: admin_users is empty; bootstrap one admin via Supabase Dashboard before removing the route." Do not proceed.
2. Overwrite `src/app/api/admin/setup/route.ts` so it exports exactly:
   ```ts
   import { NextResponse } from 'next/server';
   export const dynamic = 'force-dynamic';
   export async function GET() { return new NextResponse(null, { status: 404 }); }
   export async function POST() { return new NextResponse(null, { status: 404 }); }
   ```
   Remove every other symbol. Delete any helper functions, env reads, and Supabase client imports that previously lived in the file.
3. Create `docs/RUNBOOK.md` (the repo has `docs/AI_ASSISTANT.md` and `docs/stripe-wallets.md` — follow the same heading + section style) with these two sections:
   - `## Bootstrapping an Admin User` — steps: open Supabase project `hznpuxplqgszbacxzbhv` → Authentication → Users → invite operator → copy returned user UUID → SQL editor → run `INSERT INTO admin_users (user_id, role) VALUES ('<uuid>', 'super_admin');`. Note that `/api/admin/setup` is permanently 404 and there is no other code path to admin bootstrap.
   - `## Live Chat RLS` — names the migration file `supabase/migrations/20260515000001_live_chat_sessions_rls.sql`, lists the three policies (`live_chat_sessions_select_owner`, `live_chat_sessions_insert_owner`, `live_chat_sessions_update_owner`), describes the header contract (`x-session-id` must be forwarded by any client touching live-chat data), and notes that `/api/live-chat/notify` uses the anon or server cookie-scoped client only — never the service-role admin client.
4. Commit message MUST embed the admin_users count from step 1, e.g. `security(SEC-01): remove /api/admin/setup env-flag bootstrap (admin_users count=2 confirmed)`.

**Validation:**
- `grep -c "createAdminClient\|SUPABASE_SERVICE_ROLE_KEY\|admin_users" src/app/api/admin/setup/route.ts` → expected output `0`
- `grep -c "status: 404" src/app/api/admin/setup/route.ts` → expected output `≥ 2` (one GET, one POST)
- `test -f docs/RUNBOOK.md && grep -c "Bootstrapping an Admin User" docs/RUNBOOK.md && grep -c "Live Chat RLS" docs/RUNBOOK.md` → expected outputs `1` then `1`

**Context:** Read @src/app/api/admin/setup/route.ts (the current bootstrap surface being removed), @CLAUDE.md (project conventions), @.planning/PROJECT.md (decision: "v3.0 — `/api/admin/setup` security hole closed before any new admin work").

---

## Task 2 — Move heartbeat off service-role; migrate stale-row cleanup to `pg_cron` (SEC-02)
**Wave:** 1
**Persona:** security
**Files:**
- `src/app/api/heartbeat/route.ts` — remove `createAdminClient` import; rewrite POST handler to do an RLS-respecting anon `INSERT` into `site_visitors` only; delete the DELETE-stale-rows logic; if no in-repo or external caller is found, replace both handlers with 404
- `supabase/migrations/20260515000000_heartbeat_pg_cron_cleanup.sql` — new migration that enables `pg_cron`, schedules a 5-minute job to DELETE rows from `site_visitors` older than 10 minutes, and ensures an `INSERT` RLS policy exists on `site_visitors` for the anon role

**Depends on:** none

**Why:** SEC-02 — the current heartbeat route imports `createAdminClient` (service-role) and exposes a POST endpoint that performs a privileged DELETE. The service-role key should never be reachable from a public POST surface. Moving the DELETE to a database-internal `pg_cron` job removes the service-role dependency entirely, and downgrading the heartbeat POST to an RLS-bound anon INSERT (or removing it) eliminates the elevated-privilege public endpoint.

**Acceptance Criteria:**
- `src/app/api/heartbeat/route.ts` does not import `createAdminClient` and does not reference `SUPABASE_SERVICE_ROLE_KEY`.
- The POST handler either (a) performs only an anon-client `INSERT` into `site_visitors`, OR (b) returns 404 if no caller exists — both states are acceptable; the choice is recorded in the commit message based on the caller audit.
- `supabase/migrations/20260515000000_heartbeat_pg_cron_cleanup.sql` contains `CREATE EXTENSION IF NOT EXISTS pg_cron;`, a `cron.schedule(...)` call running every 5 minutes that issues `DELETE FROM site_visitors WHERE <timestamp_col> < now() - interval '10 minutes';` (using whatever timestamp column the existing `site_visitors` schema carries for last-ping time), and an `INSERT` policy on `site_visitors` for the `anon` role if one does not already exist.
- The caller audit is recorded in the commit message: which in-repo and external (UptimeRobot, GitHub Actions, Vercel cron) callers were found, and whether the POST was kept-as-anon-insert or removed.

**Action:**
1. **Caller audit** — run these greps verbatim and record the results for the commit message:
   - `grep -rn "/api/heartbeat" src/ scripts/ .github/ docs/ vercel.json 2>/dev/null || true`
   - `grep -rn "heartbeat" .github/workflows/ docs/ 2>/dev/null || true`
   - Also check for an UptimeRobot or external monitor reference: `grep -rn "uptimerobot\|UptimeRobot\|heartbeat" docs/ README.md 2>/dev/null || true`
2. **Decision rule:** if any caller is found (in repo config, GH Actions, or a docs runbook mentioning UptimeRobot pinging `/api/heartbeat`), KEEP the POST endpoint as an anon-client INSERT. If no caller is found anywhere in the repo or its workflows, replace both GET and POST with `return new NextResponse(null, { status: 404 })`. Either way, the service-role import must go.
3. **Rewrite `src/app/api/heartbeat/route.ts`** — top of file imports become:
   ```ts
   import { NextResponse } from 'next/server';
   import { createPublicClient } from '@/lib/supabase/public';
   ```
   The builder MUST first `Read` `src/lib/supabase/public.ts` to get the exact exported symbol name — if it exports a different function (e.g. `getPublicClient` or a const `publicClient`), substitute that exact name. The POST handler, if kept, calls the adapter then does `await supabase.from('site_visitors').insert({ ...minimal payload that satisfies the anon-role RLS policy created in step 4... })` and returns `NextResponse.json({ ok: true })` on success, `{ ok: false }` 500 on error. No DELETE. No admin client.
4. **Write the migration `supabase/migrations/20260515000000_heartbeat_pg_cron_cleanup.sql`** containing, in order:
   - `CREATE EXTENSION IF NOT EXISTS pg_cron;` (idempotent — Supabase Pro has it pre-installed)
   - A `DO $$ ... $$;` block that creates an `INSERT` RLS policy on `site_visitors` for the `anon` role IF one does not already exist (use `pg_policies` lookup in the conditional). The policy allows insert with no row-level predicate beyond the column-level shape.
   - The builder MUST inspect the existing `site_visitors` schema to confirm the timestamp column name BEFORE writing the cron DELETE. Run `mcp__supabase__execute_sql` with `select column_name from information_schema.columns where table_schema='public' and table_name='site_visitors';`. Substitute the actual column name (e.g. `last_seen`, `created_at`, `seen_at`) into the cron job DELETE statement.
   - `select cron.schedule('heartbeat-cleanup', '*/5 * * * *', $$delete from public.site_visitors where <timestamp_col> < now() - interval '10 minutes'$$);` with `<timestamp_col>` replaced by the actual column.
   - If a previous `cron.schedule` with name `heartbeat-cleanup` already exists, unschedule it first with `select cron.unschedule('heartbeat-cleanup');` wrapped in a `DO` block that swallows errors.
5. Apply the migration via the project's standard path (`npx supabase migration up` against linked project, OR queue it for the next `supabase db push`) — do not directly mutate the remote DB outside the migration file.
6. Commit message records the caller audit result: e.g. `security(SEC-02): heartbeat off service-role, pg_cron cleanup; callers found: [none|uptimerobot via docs/RUNBOOK.md|...]; POST kept as anon-insert / POST removed`.

**Risks the builder must surface in the commit body:**
- If the caller audit finds an UptimeRobot or external monitor reference but the monitor URL/credentials are not in repo, flag it so the operator can verify the monitor still receives the expected 200 from the anon-insert POST after deploy.
- If `pg_cron` is unavailable on the project's Supabase plan (the migration `CREATE EXTENSION` would fail), the builder must STOP and surface this blocker — do not silently fall back to keeping the DELETE in the route.

**Validation:**
- `grep -c "createAdminClient\|SUPABASE_SERVICE_ROLE_KEY" src/app/api/heartbeat/route.ts` → expected `0`
- `grep -cE "createPublicClient|@/lib/supabase/public|status: 404" src/app/api/heartbeat/route.ts` → expected `≥ 1` (either wired to public adapter for anon INSERT, OR reduced to 404 handlers)
- `test -f supabase/migrations/20260515000000_heartbeat_pg_cron_cleanup.sql && grep -cE "pg_cron|cron.schedule" supabase/migrations/20260515000000_heartbeat_pg_cron_cleanup.sql` → expected `≥ 2`
- `grep -ciE "DELETE FROM|\\.delete\\(" src/app/api/heartbeat/route.ts` → expected `0` (DELETE logic moved entirely to the cron job)

**Context:** Read @src/app/api/heartbeat/route.ts (current handler being rewritten), @src/lib/supabase/public.ts (to learn the exact export name to import), @supabase/migrations/20260302_enable_rls_all_tables.sql (existing RLS migration style to mirror), @CLAUDE.md (Supabase substrate conventions).

---

## Task 3 — Route sitemap through the public Supabase adapter (SEC-03)
**Wave:** 1
**Persona:** security
**Files:**
- `src/app/sitemap.ts` — replace direct `@supabase/supabase-js` import with an import from `@/lib/supabase/public`; replace the `createClient(url, anonKey)` call with the public adapter's exported factory; preserve current sitemap output shape exactly

**Depends on:** none

**Why:** SEC-03 — `src/app/sitemap.ts` currently imports directly from `@supabase/supabase-js`, bypassing the project's adapter layer (`lib/supabase/public.ts`). The adapter exists so the rest of the system can swap auth modes, add request-scoped headers, and standardize error handling in one place. Every direct SDK import is a future migration tax and a deviation from the architecture-rule-3 (adapters at seams) baseline. Closing this drops the deviation count to zero for the sitemap path and removes a copy of the anon key from outside the adapter.

**Acceptance Criteria:**
- `grep -n "from '@supabase/supabase-js'" src/app/sitemap.ts` returns 0 matches.
- `grep -n "@/lib/supabase/public" src/app/sitemap.ts` returns ≥ 1 match.
- The generated sitemap output (URL list shape, lastmod fields, priority) is unchanged before vs. after the change for a fresh build — verified by snapshotting `curl -s http://localhost:3000/sitemap.xml` (or the route's exported function output) pre and post.
- `npm run build` exits 0 after the change.

**Action:**
1. Read `src/lib/supabase/public.ts` to learn the exact export name (factory function or pre-built client). Match that exact symbol in the import.
2. Open `src/app/sitemap.ts`. Replace the `import { createClient } from '@supabase/supabase-js'` line with `import { createPublicClient } from '@/lib/supabase/public'` (substituting the real export name from step 1).
3. Find the call site that does `createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)` and replace with the adapter's factory call. Remove the now-unused env var reads.
4. Do not change the queries, the URL construction loop, the lastmod logic, or the priority field. Only the client-creation lines and imports change.

**Validation:**
- `grep -c "from '@supabase/supabase-js'" src/app/sitemap.ts` → expected `0`
- `grep -c "@/lib/supabase/public" src/app/sitemap.ts` → expected `≥ 1`
- `grep -c "NEXT_PUBLIC_SUPABASE_URL\|NEXT_PUBLIC_SUPABASE_ANON_KEY" src/app/sitemap.ts` → expected `0` (env reads now live inside the adapter)

**Context:** Read @src/app/sitemap.ts (file being modified), @src/lib/supabase/public.ts (target adapter — get exact export name), @CLAUDE.md (Supabase adapter layering section).

---

## Task 4 — Audit live-chat routes; add RLS migration for `live_chat_sessions` (SEC-04)
**Wave:** 1
**Persona:** security
**Files:**
- `supabase/migrations/20260515000001_live_chat_sessions_rls.sql` — new migration that enables RLS on `live_chat_sessions`, adds three policies (named `live_chat_sessions_select_owner`, `live_chat_sessions_insert_owner`, `live_chat_sessions_update_owner`) restricting access to the owning session — each policy wrapped in a `DO $$ ... IF NOT EXISTS ... $$` block referencing `pg_policies` so the migration is idempotent
- `src/app/api/live-chat/notify/route.ts` — modified ONLY if the audit (step 1 of Action) finds `createAdminClient` is in use; otherwise no change to this file. The migration is the primary deliverable; the route is the audit subject.

**Depends on:** none

**Why:** SEC-04 — the `/api/live-chat/*` surface currently consists of `src/app/api/live-chat/notify/route.ts`. The roadmap requires this route to use only the anon or user-scoped Supabase client (never `createAdminClient`) AND requires `live_chat_sessions` to carry session-id-scoped RLS. The repo's `supabase/migrations/` directory has no migration referencing `live_chat_sessions`, so policies must be added. RUNBOOK documentation is owned by Task 1 (with the policy names pre-specified there) so Wave 1 stays write-disjoint.

**Acceptance Criteria:**
- `grep -rn "createAdminClient" src/app/api/live-chat/` returns 0 matches.
- `supabase/migrations/20260515000001_live_chat_sessions_rls.sql` exists and contains: `alter table public.live_chat_sessions enable row level security;`, a SELECT policy `live_chat_sessions_select_owner`, an INSERT policy `live_chat_sessions_insert_owner`, and an UPDATE policy `live_chat_sessions_update_owner` — each restricting access to the owning session.
- Audit outcome recorded in the commit message: which client `/api/live-chat/notify` was using before the audit, and whether a code change was required.
- If the `live_chat_sessions` table does not yet exist in the Supabase project, the migration includes a `CREATE TABLE IF NOT EXISTS` block defining the minimal schema (`id uuid primary key default gen_random_uuid()`, `session_id text not null`, `user_id uuid null`, `created_at timestamptz not null default now()`, `updated_at timestamptz not null default now()`) BEFORE the RLS enable + policies. This is recorded in the commit message.

**Action:**
1. **Read `src/app/api/live-chat/notify/route.ts`** to determine which Supabase client it uses. If it imports `createAdminClient` from `@/lib/supabase/admin`, that is a finding — replace with `createServerClient` from `@/lib/supabase/server` (cookie-scoped, RLS-respecting) for any path that needs a user-scoped session, OR `createPublicClient` from `@/lib/supabase/public` for read-only / write-without-session paths. If it already uses one of those, no code change is needed; record this in the commit message.
2. **Inspect the `live_chat_sessions` table schema** via `mcp__supabase__execute_sql`: `select column_name, data_type from information_schema.columns where table_schema='public' and table_name='live_chat_sessions';`.
3. **Identify the session-id column** (likely `session_id`) and any `user_id` / `customer_id` column. If the query in step 2 returns zero rows (table absent), the migration must create the table first per Acceptance Criteria; record this state in the commit message.
4. **Write the migration `supabase/migrations/20260515000001_live_chat_sessions_rls.sql`** with this structure:
   - Top comment block citing SEC-04 and the date `2026-05-15`.
   - If table absent (per step 3), `CREATE TABLE IF NOT EXISTS public.live_chat_sessions (...)` with the minimal schema listed in Acceptance Criteria. Otherwise omit.
   - `alter table public.live_chat_sessions enable row level security;` (no-op if already enabled).
   - SELECT policy `live_chat_sessions_select_owner`: rows visible if `session_id = current_setting('request.header.x-session-id', true)` OR (if `user_id` column exists) `user_id = auth.uid()`. Wrap: `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='live_chat_sessions_select_owner' AND tablename='live_chat_sessions') THEN EXECUTE 'CREATE POLICY live_chat_sessions_select_owner ON public.live_chat_sessions FOR SELECT USING (session_id = current_setting(''request.header.x-session-id'', true))'; END IF; END $$;`
   - INSERT policy `live_chat_sessions_insert_owner`: anon role may INSERT a new session row provided the inserted `session_id` matches the `x-session-id` header. Same `IF NOT EXISTS` wrapper.
   - UPDATE policy `live_chat_sessions_update_owner`: only allow update where `session_id = current_setting('request.header.x-session-id', true)`. Same wrapper.
5. Do NOT modify `docs/RUNBOOK.md` from this task — Task 1 owns the RUNBOOK write and has been instructed to include the `## Live Chat RLS` section referencing the three policy names above. The policy names are the contract between Task 1 and Task 4.

**Validation:**
- `grep -rc "createAdminClient" src/app/api/live-chat/ | awk -F: '{s+=$2} END {print s+0}'` → expected `0`
- `test -f supabase/migrations/20260515000001_live_chat_sessions_rls.sql && grep -ciE "enable row level security|create policy" supabase/migrations/20260515000001_live_chat_sessions_rls.sql` → expected `≥ 4` (1 RLS enable + 3 policies)
- `grep -c "live_chat_sessions_select_owner\|live_chat_sessions_insert_owner\|live_chat_sessions_update_owner" supabase/migrations/20260515000001_live_chat_sessions_rls.sql` → expected `≥ 3`

**Context:** Read @src/app/api/live-chat/notify/route.ts (audit target), @supabase/migrations/20260302_enable_rls_all_tables.sql (style reference for RLS migrations in this repo), @supabase/migrations/20260228_fix_rls_policies_and_is_admin.sql (policy idempotency pattern reference), @CLAUDE.md.

---

## Task 5 — Final build + type-check verification
**Wave:** 2
**Persona:** none
**Files:**
- `.planning/phase-1-verification.md` — new short note recording the three verification commands and their outputs

**Depends on:** Task 1, Task 2, Task 3, Task 4

**Why:** Success criterion 5 from the roadmap demands `npm run build` and `npx tsc --noEmit` exit 0 after the security fixes — no regressions introduced. Wave 1 changes touch four files plus two new migrations; type drift or import errors are plausible (especially Task 3 swapping import shape, or Task 2's new public-adapter import not matching the actual exported symbol). A dedicated final task makes this gate observable and keeps the wave-1 tasks atomic.

**Acceptance Criteria:**
- `npx tsc --noEmit` exits 0 (no `error TS` output).
- `npm run build` exits 0; the Next.js build output reports a successful compile.
- `grep -rn "createAdminClient" src/app/api/admin/setup/route.ts src/app/api/heartbeat/route.ts src/app/sitemap.ts src/app/api/live-chat/` returns 0 matches (cross-task wiring check: no SEC-touched file regresses to importing the admin client).
- `.planning/phase-1-verification.md` exists and records the three commands run plus a short (≤ 5 lines per check) excerpt of each output.

**Action:**
1. Run `npx tsc --noEmit` and capture the output. If exit code is non-zero or `error TS` appears, identify the failing file, read it, and apply the minimal fix. The most likely failure modes:
   - Task 2 or Task 3 imported a symbol from `@/lib/supabase/public` that does not match the actual export name — fix the import to match what `src/lib/supabase/public.ts` exports.
   - The rewritten `src/app/api/admin/setup/route.ts` still has a leftover `import` of a removed symbol — strip it.
   - A stale generated type from `src/lib/supabase/types.ts` doesn't yet know about `site_visitors` or `live_chat_sessions` columns — if a type error references a missing table, run `npx supabase gen types typescript --linked > src/lib/supabase/types.ts` to refresh.
2. Run `npm run build`. If non-zero exit or any error, repeat diagnose-and-fix. Common failures:
   - Next.js complains that `src/app/sitemap.ts` uses an export with a runtime that the new public adapter doesn't satisfy — verify the adapter is server-safe (no `cookies()` call that needs a request context in an SSG route).
3. Run the cross-task wiring grep from Acceptance Criteria; if any of the four target paths now imports `createAdminClient`, that is a regression and the builder must trace it to the offending task and fix at the source.
4. If all three checks pass, write `.planning/phase-1-verification.md` with three sections — one per check — each listing the command run and a short output excerpt. Close with a final line `Phase 1 verified: <date>`.

**Validation:**
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → expected `0`
- `npm run build 2>&1 | tail -30 | grep -ciE "compiled successfully|✓ compiled"` → expected `≥ 1` (Next.js success marker for 14.2.35)
- `grep -rcE "createAdminClient" src/app/api/admin/setup/route.ts src/app/api/heartbeat/route.ts src/app/sitemap.ts src/app/api/live-chat/ 2>/dev/null | awk -F: '{s+=$2} END {print s+0}'` → expected `0`

**Context:** Read @.planning/PROJECT.md (constraint: Next 14.2.35, TS strict, Node 20), @CLAUDE.md (npm scripts available: `npm run build`, `npm run type-check`).

---

## Success Criteria

- [ ] `GET /api/admin/setup` and `POST /api/admin/setup` return 404 (or 405) on production — confirmed by `curl -s -o /dev/null -w "%{http_code}" https://aquadorcy.com/api/admin/setup` returning 404 or 405 after deploy
- [ ] `src/app/api/heartbeat/route.ts` contains no `createAdminClient` import; the POST handler either does an anon `INSERT` only or returns 404; the stale-row DELETE logic lives in a `pg_cron` job created by `supabase/migrations/20260515000000_heartbeat_pg_cron_cleanup.sql`
- [ ] `src/app/sitemap.ts` imports from `@/lib/supabase/public`, not from `@supabase/supabase-js`; `grep "from '@supabase/supabase-js'" src/app/sitemap.ts` returns 0 matches
- [ ] `/api/live-chat/*` routes use only the anon or server (cookie-scoped) Supabase client; `supabase/migrations/20260515000001_live_chat_sessions_rls.sql` enables RLS on `live_chat_sessions` and creates session-id-scoped SELECT/INSERT/UPDATE policies; `docs/RUNBOOK.md` documents the policies
- [ ] `npm run build` and `npx tsc --noEmit` both exit 0; no new errors introduced by the four security fixes

---

## Verification Contract

### Contract for Task 1 — `/api/admin/setup` lockdown (route)
**Check type:** grep-match
**Command:** `grep -c "status: 404" src/app/api/admin/setup/route.ts`
**Expected:** `≥ 2`
**Fail if:** Either GET or POST handler is missing the 404 response.

### Contract for Task 1 — admin client absence
**Check type:** grep-match
**Command:** `grep -cE "createAdminClient|SUPABASE_SERVICE_ROLE_KEY|admin_users" src/app/api/admin/setup/route.ts`
**Expected:** `0`
**Fail if:** Any service-role reference, admin-client import, or admin_users mutation remains in the file.

### Contract for Task 1 — runbook bootstrap section
**Check type:** grep-match
**Command:** `grep -c "Bootstrapping an Admin User" docs/RUNBOOK.md`
**Expected:** `1`
**Fail if:** Runbook section missing — no documented path for future admin creation.

### Contract for Task 1 — runbook live-chat section
**Check type:** grep-match
**Command:** `grep -c "Live Chat RLS" docs/RUNBOOK.md`
**Expected:** `1`
**Fail if:** Runbook does not document the live-chat RLS policies (cross-task contract with Task 4).

### Contract for Task 2 — heartbeat admin client removed
**Check type:** grep-match
**Command:** `grep -cE "createAdminClient|SUPABASE_SERVICE_ROLE_KEY" src/app/api/heartbeat/route.ts`
**Expected:** `0`
**Fail if:** Service-role usage survives in heartbeat.

### Contract for Task 2 — heartbeat new wiring
**Check type:** grep-match
**Command:** `grep -cE "@/lib/supabase/public|status: 404" src/app/api/heartbeat/route.ts`
**Expected:** `≥ 1`
**Fail if:** Heartbeat does neither anon-insert via public adapter nor returns 404 — wired to nothing legitimate.

### Contract for Task 2 — heartbeat DELETE migrated out
**Check type:** grep-match
**Command:** `grep -ciE "DELETE FROM|\\.delete\\(" src/app/api/heartbeat/route.ts`
**Expected:** `0`
**Fail if:** DELETE logic still lives in the route file instead of in pg_cron.

### Contract for Task 2 — pg_cron migration exists
**Check type:** file-exists
**Command:** `test -f supabase/migrations/20260515000000_heartbeat_pg_cron_cleanup.sql && echo EXISTS`
**Expected:** `EXISTS`
**Fail if:** Migration file missing.

### Contract for Task 2 — pg_cron migration content
**Check type:** grep-match
**Command:** `grep -cE "pg_cron|cron.schedule" supabase/migrations/20260515000000_heartbeat_pg_cron_cleanup.sql`
**Expected:** `≥ 2`
**Fail if:** Migration does not enable pg_cron and schedule the cleanup job.

### Contract for Task 3 — sitemap direct SDK removed
**Check type:** grep-match
**Command:** `grep -c "from '@supabase/supabase-js'" src/app/sitemap.ts`
**Expected:** `0`
**Fail if:** sitemap.ts still imports the raw SDK.

### Contract for Task 3 — sitemap adapter import
**Check type:** grep-match
**Command:** `grep -c "@/lib/supabase/public" src/app/sitemap.ts`
**Expected:** `≥ 1`
**Fail if:** sitemap.ts does not import via the public adapter.

### Contract for Task 4 — live-chat admin client absence
**Check type:** grep-match
**Command:** `grep -rc "createAdminClient" src/app/api/live-chat/ | awk -F: '{s+=$2} END {print s+0}'`
**Expected:** `0`
**Fail if:** Any live-chat route imports the service-role admin client.

### Contract for Task 4 — RLS migration exists
**Check type:** file-exists
**Command:** `test -f supabase/migrations/20260515000001_live_chat_sessions_rls.sql && echo EXISTS`
**Expected:** `EXISTS`
**Fail if:** Migration file missing.

### Contract for Task 4 — RLS migration content
**Check type:** grep-match
**Command:** `grep -ciE "enable row level security|create policy" supabase/migrations/20260515000001_live_chat_sessions_rls.sql`
**Expected:** `≥ 4`
**Fail if:** Migration does not enable RLS and create at least three policies (SELECT/INSERT/UPDATE).

### Contract for Task 4 — RLS policy names
**Check type:** grep-match
**Command:** `grep -c "live_chat_sessions_select_owner\|live_chat_sessions_insert_owner\|live_chat_sessions_update_owner" supabase/migrations/20260515000001_live_chat_sessions_rls.sql`
**Expected:** `≥ 3`
**Fail if:** The three named policies are not all present (breaks the contract with Task 1's RUNBOOK section).

### Contract for Task 5 — typecheck clean
**Check type:** command-exit
**Command:** `npx tsc --noEmit 2>&1 | grep -c "error TS"`
**Expected:** `0`
**Fail if:** Any TypeScript compilation errors.

### Contract for Task 5 — build clean
**Check type:** command-exit
**Command:** `npm run build 2>&1 | tail -30 | grep -ciE "compiled successfully|✓ compiled"`
**Expected:** `≥ 1`
**Fail if:** Next.js build does not report a successful compile.

### Contract for Task 5 — cross-cutting admin-client regression
**Check type:** grep-match
**Command:** `grep -rcE "createAdminClient" src/app/api/admin/setup/route.ts src/app/api/heartbeat/route.ts src/app/sitemap.ts src/app/api/live-chat/ 2>/dev/null | awk -F: '{s+=$2} END {print s+0}'`
**Expected:** `0`
**Fail if:** Any of the four SEC-touched paths regressed to importing the admin client.

### Contract for Task 5 — verification note exists
**Check type:** file-exists
**Command:** `test -f .planning/phase-1-verification.md && echo EXISTS`
**Expected:** `EXISTS`
**Fail if:** Verification note missing — no record that the gate was actually run.

### Contract for Phase — production endpoint hardening (post-deploy, behavioral)
**Check type:** behavioral
**Command:** (manual, after deploy) `curl -s -o /dev/null -w "%{http_code}" https://aquadorcy.com/api/admin/setup`
**Expected:** `404` or `405`
**Fail if:** Production returns any 2xx or 3xx — the route was not actually deployed in its locked-down form.
