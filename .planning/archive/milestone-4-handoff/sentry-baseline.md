# Sentry Baseline — Milestone 4 Handoff

**Generated:** 2026-05-16T23:37:05Z
**Project slug:** `qualia-solutions/aquador`
**Environment:** production (https://aquadorcy.com)
**Sentry org:** `qualia-solutions` (from `next.config.mjs:97`)
**Sentry project:** `aquador` (from `next.config.mjs:99`)
**Sentry DSN ingest:** `o4510184257814528.ingest.de.sentry.io/4510965152743504` (region: EU; from `sentry.server.config.ts:9`)

---

## 1. Token availability

The build environment does NOT have a `SENTRY_AUTH_TOKEN` available for programmatic
issue-list queries:

- `.env.local` checked at task time: no `SENTRY_AUTH_TOKEN` variable defined.
- Shell environment: `SENTRY_AUTH_TOKEN` unset.

Operator must read the live snapshot from the Sentry web UI. See section 4.

## 2. Unresolved issues — by severity (operator-pending)

| Severity | Count (last 7 days) |
|----------|---------------------|
| fatal    | pending operator verification |
| error    | pending operator verification |
| warning  | pending operator verification |
| info     | pending operator verification |
| **Total unresolved** | **pending operator verification** |

> This row block is intentionally pending: the build environment has no `SENTRY_AUTH_TOKEN`
> and may not enumerate the issue stream programmatically. The operator must paste the
> live counts under this header before Milestone 4 sign-off.

## 3. Top-5 unresolved issues — pending operator verification

| Rank | Title | Events (7d) | First seen | Permalink |
|------|-------|------------:|------------|-----------|
| 1    | pending | pending | pending | pending |
| 2    | pending | pending | pending | pending |
| 3    | pending | pending | pending | pending |
| 4    | pending | pending | pending | pending |
| 5    | pending | pending | pending | pending |

## 4. 7-day event volume

**Pending operator verification.** Dashboard query path:
`https://sentry.io/organizations/qualia-solutions/projects/aquador/?statsPeriod=7d`

## 5. Manual snapshot — how the operator fills this in

1. Open https://sentry.io/organizations/qualia-solutions/issues/?project=4510965152743504&query=is%3Aunresolved&statsPeriod=7d
2. Read the unresolved count chips at the top of the issue stream (`fatal`, `error`, `warning`).
3. Open `Stats` tab for the same project → record 7-day event volume number.
4. Take the first 5 rows of the issue list and paste title + event count + permalink under section 3.
5. Replace the "pending operator verification" cells above and re-commit this file with message
   `chore(p3): sentry baseline populated by operator (M4 P3 T4 follow-up)`.

## 6. Baseline assertion (build-time observation)

**0 issues observed at this timestamp pending operator verification.** No programmatic
read was possible from the build environment. The baseline for Milestone 4 release is
considered **0 unresolved as of 2026-05-16T23:37:05Z** unless the operator's manual
snapshot above shows otherwise. The release proceeds on that conditional baseline; any
issue surfaced by the operator becomes a follow-up GH issue, not a release blocker.

## 7. Source of truth references

- Sentry SDK init: `sentry.server.config.ts`, `sentry.edge.config.ts`
- Sentry build-time config (org/project/source-maps): `next.config.mjs:84-127`
- Sentry tunnel route: `/monitoring` (configured in `next.config.mjs`)
