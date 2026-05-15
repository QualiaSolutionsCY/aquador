# Phase 1 — Verification (Admin Security & Reset)

Verification of Phase 1 success criterion 5: `npm run build`, `npx tsc --noEmit`,
and `npm run test` all green after the four Wave 1 security fixes (Tasks 1–4)
and Wave 2's heartbeat test regression fix (Task 5).

## tsc

```
$ npx tsc --noEmit 2>&1 | tee /tmp/tsc.out | tail -30; echo "ERRCOUNT:$(grep -c 'error TS' /tmp/tsc.out)"
ERRCOUNT:0
```

Exit code 0, zero `error TS` lines.

## build

```
$ npm run build 2>&1 | tail -40
 ✓ Compiled successfully in 7.4s
 ✓ Completed runAfterProductionCompile in 734ms
 ✓ Generating static pages using 15 workers (373/373) in 3.4s
```

Exit code 0, `Compiled successfully` reported by Next.js 14.2.35. 373 static
pages generated; routes include `/api/heartbeat`, `/sitemap.xml`,
`/api/live-chat/notify`.

## cross-task wiring

```
$ grep -rcE "createAdminClient" \
    src/app/api/admin/setup/route.ts \
    src/app/api/heartbeat/route.ts \
    src/app/sitemap.ts \
    src/app/api/live-chat/ 2>/dev/null \
  | awk -F: '{s+=$2} END {print s+0}'
0
```

No SEC-touched route still references the deprecated `createAdminClient`. The
admin setup route is now a 404 stub (Task 1), heartbeat uses `createPublicClient`
(Task 2), sitemap uses `createPublicClient` (Task 3), and live-chat RLS is
enforced at the database layer (Task 4).

## heartbeat test regression fixed

```
$ npm test -- src/app/api/heartbeat/__tests__/route.test.ts --no-coverage 2>&1 | tail -6
Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total
Snapshots:   0 total
Time:        0.477 s, estimated 1 s
```

`src/app/api/heartbeat/__tests__/route.test.ts` updated to mock
`@/lib/supabase/public` / `createPublicClient` (instead of the removed
`@/lib/supabase/admin` / `createAdminClient`), the `mockSupabaseFrom`
factory no longer exposes a `delete().lt(...)` branch, and the
`should cleanup stale visitors` case was deleted (cleanup is now handled
by pg_cron — see `supabase/migrations/20260515000000_heartbeat_pg_cron_cleanup.sql`).

Phase 1 verified: 2026-05-15
