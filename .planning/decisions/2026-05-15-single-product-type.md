---
adr: "single-product-type"
title: "One canonical Product type (Supabase shape)"
date: 2026-05-17
status: Accepted
deciders: Fawzi Goussous (Qualia)
---

# ADR-04: One canonical Product type (Supabase shape)

## Context

The v2.0 codebase carried three coexisting product type definitions:

1. `LegacyProduct` in `src/types/index.ts`, used by some shop page
   components and carried forward from the original static-catalog era.
2. A variant-based `Product` in `src/types/product.ts` with helper
   functions like `getDefaultVariant()` and `getVariantLabel()`, intended
   to support per-product variant pricing (50ml, 100ml).
3. The Supabase-generated `Product` in `src/lib/supabase/types.ts`,
   produced by `npx supabase gen types` against the live schema.

The drift had a real cost. `ProductCard.tsx` had to branch on shape
detection to know which interface it was rendering. Every consumer of
product data paid an inference tax. Adding a new field meant editing
three type files and the converter functions between them. The
Supabase schema (the actual source of truth) could change underneath
us without the legacy types noticing.

The forcing function for resolution was Milestone 3, the admin reset:
the admin product CRUD reads and writes the Supabase schema directly,
which made the three-type split actively harmful (admin would write
fields the storefront types did not know existed).

## Decision

The Supabase shape is canonical. `Product` is re-exported from
`src/types/index.ts` as `export type { Product } from
'@/lib/supabase/types'`. Internal callers import either from
`@/types` (the re-export) or from `@/lib/supabase/types` directly.

`src/types/product.ts` was reduced to two enum types (`ProductType`
and `ProductSize`) that do not depend on Supabase generation and
serve as named string literals used in form validation. The
`LegacyProduct` interface and the standalone variant-based `Product`
shape were deleted. The `getDefaultVariant()` and `getVariantLabel()`
helpers are no longer exported; variant data lives on the Supabase
product row directly.

Validation: `src/types/index.ts` lines 11 through 14 establish the
canonical export. `src/types/product.ts` is two lines of enum
declarations. `grep -rn "LegacyProduct" src/` returns no production
hits.

## Consequences

What this buys us:

- Single source of truth. Adding a column to the `products` table in
  Supabase and running `npx supabase gen types` propagates the field to
  every consumer in one step.
- Type safety with the database schema. A field rename in the schema
  produces a TypeScript error at every callsite, not a runtime null.
- `ProductCard.tsx` no longer branches on shape detection. The card
  renders one shape and that shape matches the database.
- The admin and the storefront read the same type. Admin writes that
  pass type-check will not produce storefront type errors at runtime.

What this costs:

- The Supabase schema is now load-bearing on every storefront
  component. A schema change without a coordinated type regeneration
  produces build failures in CI. This is a feature, not a bug, but it
  requires operator discipline.
- Snake_case field names from Postgres surface in TypeScript
  (`product.product_type`, `product.image_url`). Adapter functions in
  `src/lib/supabase/product-service.ts` no longer convert these to
  camelCase; the storefront consumes snake_case directly. New
  contributors will hit this once and learn it.
- The `CLAUDE.md` "Type System" section still documents the legacy
  three-type split. It predates this ADR and should be updated in a
  follow-up documentation pass.

## Reverting Criteria

Revert to a hand-maintained Product type only if one of these holds:

1. The Supabase schema becomes unstable enough that the generated
   type churns weekly. At that point the answer is to stabilize the
   schema, not to fork the type. Currently the schema is stable
   through Milestone 4.
2. A future ORM swap removes the `supabase gen types` capability and
   no equivalent codegen exists. This would require a database
   provider migration, which is explicitly out of scope per
   `PROJECT.md` line 89 ("Replacing Supabase or Stripe (working fine,
   stay)").
3. A specific component genuinely needs a richer in-memory shape
   than the schema provides (computed fields, joined relations).
   The right answer there is a view type or a select-shape, not a
   parallel canonical Product.

## References

- `PROJECT.md` line 118 (Key Decisions row, v3.0 entry: one canonical
  Product type sourced from the Supabase shape).
- `PROJECT.md` line 123 (Key Decisions row, v3.0 entry: schema stays,
  type system unifies in code).
- `src/types/index.ts` lines 11 through 14 (the canonical re-export).
- `src/types/product.ts` (now two enum lines).
- `src/lib/supabase/types.ts` (the generated canonical shape).
- `src/lib/supabase/product-service.ts` (query functions that return
  the canonical Product).
- `src/components/ui/ProductCard.tsx` line 39 (`import type
  { Product } from '@/lib/supabase/types';` directly).
- `CLAUDE.md` "Type System" section (stale; documents the legacy
  three-type split; flagged for follow-up documentation pass).
