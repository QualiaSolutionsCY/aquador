---
adr: "nextjs16-react19-stack"
title: "Migrate to Next.js 16 + React 19 at v3.0 reset"
date: 2026-05-17
status: Accepted
deciders: Fawzi Goussous (Qualia)
---

# ADR-01: Migrate to Next.js 16 + React 19 at v3.0 reset

## Context

The v1.0 and v2.0 storefronts ran on Next.js 14.2.35 with React 18. v3.0 was scoped
as a full reset of the design system, storefront, and admin panel (same data,
same business, new presentation). Two paths were available.

Path A: hold the framework stack at 14.2.x / React 18 through the v3.0 reset,
then migrate the framework afterward as a separate milestone. This keeps the
design work and the framework upgrade as independent concerns and reduces the
number of variables in any single PR.

Path B: migrate Next.js and React concurrently with the v3.0 design reset,
inside Milestone 1 (Design Foundation), so every new component is authored
directly against the target stack rather than being ported once at build time
and again post-migration.

The substrate cost of Path A is paying the design migration twice: once to
build under 14/18, once again to revise the same components for the App Router
and Server Components semantics that Next 16 enforces. The risk of Path B is
absorbing Next 16 and React 19 breaking changes (RSC default boundaries,
caching defaults, action handlers) at the same time as design churn.

## Decision

Migrate to Next.js 16 and React 19 inside Milestone 1, concurrently with the
v3.0 reset. The new design system, storefront primitives, and admin shell are
authored directly against the target stack, never against 14.2.

`package.json` currently pins `next: ^16.2.6`, `react: ^19.0.0`,
`react-dom: ^19.0.0`. Node target is v20 (see `.nvmrc`).

## Consequences

What this buys us:

- Components in `src/components/ui/` and `src/components/storefront/` are
  authored once against the final stack. No second-pass refactor for
  Server Component boundaries, async params, or React 19 use() semantics.
- The Sentry source-map upload contract, the Stripe webhook handler, and
  the Supabase RLS-aware admin all run on the framework version we intend
  to operate against in production.

What this costs:

- A reduced inventory of pre-validated Framer Motion patterns for Server
  Component paths. Motion lives in client components only; route shells stay
  server-rendered. This constraint is reflected throughout
  `src/components/storefront/`.
- The team absorbs Next 16 caching defaults (the `dynamic = 'force-static'`
  vs cookie-bound page split) alongside design work rather than as a
  contained migration sprint. Documentation for these splits lives in the
  component files that exercise them, not in a single migration guide.
- React 19 `useFormState` and `useActionState` semantics replaced the older
  Formik-style admin form patterns. Admin form refactors landed inside
  Milestone 3 rather than a separate migration milestone.

## Reverting Criteria

Revert to the 14.2.x LTS line only if one of the following is observed:

1. A Next 16 minor release introduces instability on a critical-path
   feature: Stripe Checkout Session redirect, RLS-aware admin auth, or
   Sentry source-map ingestion. Track via the Sentry error rate dashboard
   over a 7-day window.
2. A React 19 server action regression breaks the admin mutation surface
   (`/admin/products`, `/admin/orders`, `/admin/blog`) in a way that
   cannot be patched in userland.
3. A Vercel deployment-target constraint forces the project onto a
   Node 18 runtime that does not support React 19's required runtime
   features. Currently Node 20 is the deployment target and this is not
   in play.

If none of these conditions occur, no revert is warranted. The migration
has held through Milestone 2, Milestone 3, and Milestone 4 Phases 1 through 3
without a stack-attributable production incident.

## References

- `package.json` lines 1 through 60 (pins `next: ^16.2.6`, `react: ^19.0.0`).
- `.nvmrc` line 1 (Node 20 target).
- `PROJECT.md` line 117 (Key Decisions row, v3.0 entry: migrate to
  Next 16 and React 19 as part of M1).
- `PROJECT.md` line 102 (the legacy v2.0 substrate row, which still
  references Next 14.2.35 and is preserved for historical context).
- `CLAUDE.md` "Architecture" section (the project-level guide still names
  Next 14.2.35; it predates this ADR and should be updated in a follow-up
  documentation pass).
- `JOURNEY.md` Milestone 1 entries (stack-upgrade scope).
