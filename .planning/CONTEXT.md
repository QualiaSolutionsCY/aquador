# CONTEXT — Aquad'or domain glossary

Append-only as terms emerge. Every road agent loads this BEFORE PROJECT.md and DESIGN.md. Keep terse — one sentence per entry.

## Language

- **Aquad'or** — the brand. Cyprus-based luxury perfume retailer; the project name. Avoid: "Aquador" (missing apostrophe), "aquador-next" (deploy slug, not user-facing).
- **Perfume** — the main product class. Specific product types under the umbrella: Perfume (default), Essence Oil, Body Lotion. Avoid: "fragrance" as a product noun (it's a category attribute, not a SKU class).
- **Variant** — a size / type variation of one perfume SKU (e.g. 50ml vs 100ml). Each variant has its own price + stock state.
- **Note** — a single fragrance ingredient (e.g. "bergamot", "oud", "vanilla"). Notes belong to a `category` (floral, fruity, woody, oriental, gourmand) and a `layer` (top, heart, base).
- **Composition** — the three-layer (top / heart / base) note arrangement of a custom perfume.
- **Custom perfume** — a user-built perfume via `/create-perfume`. Has a `composition` and a chosen `volume` (50ml or 100ml). Priced flat: 50ml = €29.99, 100ml = €199.00.
- **Order** — a completed purchase persisted to Supabase `orders`. Created by the Stripe webhook, not the client.
- **Customer** — a buyer. Avoid: "user" in customer-facing contexts (User is reserved for admin in code).
- **Admin** — an entry in the `admin_users` Supabase table. Has a role (`admin` or `super_admin`). Admins access `/admin/*` via middleware-gated auth.
- **Cart** — pre-purchase state, lives in React Context + localStorage key `aquador_cart`. Validated server-side before becoming an Order.
- **Concierge** — the AI fragrance assistant. Re-skinned in v3.0 as a concierge (editorial voice), not a chatbot. Backed by OpenRouter, default model Gemini 2.0 Flash.
- **Journal** — the blog. v3.0 may rename "blog" to "journal" in user-facing copy; code paths stay as `/blog`.
- **Category** — product taxonomy. Static definitions in `src/lib/categories.ts`: women, men, niche, lattafa-original, al-haramain-originals, victorias-secret-originals. New categories require code change + Supabase enum update.
- **Brand** — a perfume brand (Lattafa, Al-Haramain, Victoria's Secret, niche houses). A facet of category, used as a filter in shop.
- **Pyramid** — synonym for composition layers (top / heart / base). User-facing copy may use "pyramid" for warmth; code uses "composition".

## Flagged ambiguities

- **User vs Customer** — in admin code, User = admin_users row; in storefront code, "customer" is the right noun. Don't use "User" in customer-facing copy or component prop names.
- **Product vs Variant** — `Product` is the catalog entry; `Variant` is the buyable SKU. ProductCard shows Product; CartItem references Variant.
- **Order vs Session** — a Stripe Checkout Session becomes an Order only after webhook confirmation. Don't conflate the two in code or UX copy.
- **Blog vs Journal** — `/blog` route stays; rename happens in copy only (M2 polish, not infrastructure).
- **Admin vs Operator** — Admin is the role in code; "operator" is the user-facing-noun in handoff copy (RUNBOOK addresses "the operator").

## Conventions

- **Currency:** EUR (€) everywhere. Formatted via `src/lib/currency.ts`. Never display raw cents — always formatted.
- **Shipping:** always free in v3.0. Don't ask the user; never show a calculation.
- **Stock:** binary in-stock / out-of-stock at the variant level. No quantity-on-hand exposed to users.
- **Returns:** referenced in trust microcopy; specific policy lives in `docs/policies/` (created in M4 if not already present).

## Shop filtering threshold

The shop page filter bar (SHOP-01) and sort dropdown (SHOP-02) operate client-side against the full RSC-fetched product list. This is correct at the current catalog size (~100 SKUs) but stops being correct once the catalog grows past the threshold below.

- **Current strategy:** the shop RSC fetches every active product via `getAllProducts()` and hands the array to `applyShopFilters` and `applyShopSort` in `src/lib/shop/filter-schema.ts`. The URL drives state; no DB round-trip per filter change.
- **Trigger threshold:** when the active SKU count crosses 500, the client-side strategy stops being acceptable (initial HTML payload bloat, hydration cost, search latency).
- **Migration path:** add `getFilteredProducts(filters, sort)` to `src/lib/supabase/product-service.ts` that pushes the filter set into a Supabase query (use `.in()` for multi-value, `.gte()` / `.lt()` for price bands). Switch the shop page to dynamic rendering by accepting `searchParams` as a page prop (or via `connection()`), and call the new service. The URL contract in `filter-schema.ts` stays unchanged.
