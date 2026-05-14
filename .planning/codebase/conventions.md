# Codebase Conventions — Aquad'or

Sampled: `src/app/page.tsx`, `src/app/shop/page.tsx`, `src/app/admin/products/page.tsx`, `src/app/api/checkout/route.ts`, `src/middleware.ts`, `src/components/cart/CartProvider.tsx`, `src/components/ui/Button.tsx`, `src/components/products/ProductDetails.tsx`, `src/components/products/index.ts`, `src/lib/api-utils.ts`, `src/lib/utils.ts`, `src/lib/constants.ts`, `src/lib/perfume/pricing.ts`, `src/lib/supabase/product-service.ts`, `src/lib/__tests__/currency.test.ts`, `e2e/cart.spec.ts`, `src/types/cart.ts`, `src/hooks/useReducedMotion.ts`.

## Naming
- **Files**: PascalCase for React components (`CartProvider.tsx`, `ProductDetails.tsx`, `Button.tsx`), kebab-case for routes/non-component TS (`api-utils.ts`, `product-service.ts`, `rate-limit.ts`, `cart-reducer.test.ts`). App-router files lowercase (`page.tsx`, `layout.tsx`, `route.ts`, `loading.tsx`).
- **Components**: PascalCase exports (`Button`, `CartProvider`, `ProductsPage`). Page components named after route (`src/app/admin/products/page.tsx:17` → `ProductsPage`).
- **Functions**: camelCase (`getAllProducts`, `escapePostgrestQuery`, `formatApiError`). Hooks `use*` prefix (`src/hooks/useReducedMotion.ts:31`).
- **Constants**: SCREAMING_SNAKE_CASE for module-level constants (`CART_STORAGE_KEY`, `FREE_SHIPPING_THRESHOLD`, `PRODUCT_COLUMNS`, `MAX_CART_ITEMS` — see `src/lib/constants.ts:33-42`). Often suffixed `as const`.

## Component patterns
- **Server component default**; `'use client'` only when needed (state, hooks, browser APIs). `src/app/shop/page.tsx` is server; `src/app/admin/products/page.tsx:1` is client.
- **Props typing**: `interface` for component props (`ButtonProps` `src/components/ui/Button.tsx:9`, `ProductDetailsProps` `src/components/products/ProductDetails.tsx:22`). `type` for unions/discriminated (`CartAction` `src/types/cart.ts:18`).
- **Default exports** for components (`export default function`, `export default Button`). Named exports for utils, hooks, types. Barrel re-exports in `src/components/products/index.ts:1` use `default as` aliasing.
- **No per-component folder**: components are flat files inside a domain folder (`components/products/ProductDetails.tsx`, not `components/products/ProductDetails/index.tsx`).

## File organization
- **Hooks**: `src/hooks/*.ts` (top-level, flat).
- **Types**: `src/types/*.ts` (domain-split: `cart.ts`, `product.ts`, `order.ts`). DB types live with the adapter at `src/lib/supabase/types.ts`. Component-local props stay in the component file.
- **Tests**: colocated `__tests__` folders next to source (`src/lib/__tests__/currency.test.ts`, `src/components/cart/__tests__/CartIcon.test.tsx`, `src/components/ui/__tests__/Button.test.tsx`). E2E separate at `/e2e/*.spec.ts`.
- **Constants**: centralized in `src/lib/constants.ts` for cross-cutting (shipping, cart limits, product labels). Local consts (e.g. `CART_STORAGE_KEY` `src/components/cart/CartProvider.tsx:10`) stay in their module.

## Import style
- **Path alias**: `@/` → `src/` used everywhere (`@/lib/currency`, `@/types/cart`, `@/hooks/useReducedMotion`). Relative imports only for siblings inside the same folder (`./ShopContent`, `./public`).
- **Order**: third-party first (react/next, then libs like `zod`, `@sentry/nextjs`), then `@/` aliased local imports. See `src/app/api/checkout/route.ts:1-10`, `src/components/cart/CartProvider.tsx:1-8`.
- **Type imports**: `import type` used for type-only imports (`src/components/cart/CartProvider.tsx:6` `import type { Cart, CartItem … }`, `src/types/cart.ts:1` `import type { ProductType … }`). Mixed `import { X, type Y }` also acceptable.

## API route pattern
Reference: `src/app/api/checkout/route.ts`.
- `export const maxDuration = 10` at top (line 12).
- Imports: `NextRequest`, `NextResponse`, `* as Sentry from '@sentry/nextjs'`, `z` from zod.
- Zod schema declared at module level (line 14).
- Handler structure: rate-limit check first (`checkRateLimit(request, 'checkout')` line 22), then `try` block, Zod `safeParse` validation returning 400 on failure (line 28-34), business logic, `try/catch` wraps everything with `Sentry.captureException(error)` + `formatApiError()` returning 500 (line 120-126).
- Request IDs propagated via middleware header `x-request-id` (`src/middleware.ts:7-10`, read via `getRequestId()` in `src/lib/api-utils.ts:13`).
- Structured logging helper `createLogEntry()` returns JSON string (`src/lib/api-utils.ts:20`).

## State management
- **Cart**: React Context + `useReducer` with reducer-action union (`src/components/cart/CartProvider.tsx:32-84`). `CartContext = createContext<CartContextType | null>(null)`, custom `useCart()` hook throws if used outside provider (line 210-216).
- **Persistence**: localStorage with Zod validation on rehydrate (line 89-127), debounced writes via `useRef<NodeJS.Timeout>` + `CART_DEBOUNCE_MS` (line 138-165).
- **Action handlers**: wrapped in `useCallback` (line 167-185).
- Other shared state appears to use the same Context-provider pattern (`src/components/providers/` directory exists). No Redux/Zustand.

## Styling
- **Tailwind only**, no CSS modules. Global styles in `src/app/globals.css`.
- **Class composition**: `cn()` helper at `src/lib/utils.ts:3` wraps `clsx` (no `tailwind-merge`). Used throughout — see `src/components/ui/Button.tsx:18` for nested `cn()` calls per variant.
- **Variant styles**: defined as object map keyed by variant name inside the component (`src/components/ui/Button.tsx:25-46` `styleVariants`, `sizes`).
- **Inline arbitrary values**: heavy use of Tailwind arbitrary values for fluid type (`text-[clamp(1.75rem,1.25rem+2.5vw,3rem)]` `src/components/products/ProductDetails.tsx:50`) and brand colors (`text-gold/60`, `ring-gold`).

## Test style
- **Jest**: `*.test.ts(x)` inside colocated `__tests__/` folder. `describe`/`it` nesting (`src/lib/__tests__/currency.test.ts:11-24`). Relative imports to subject (`from '../currency'`).
- **Playwright e2e**: `e2e/*.spec.ts`, uses `test.describe` + `test.beforeEach`, locators by aria-label or visible text (`e2e/cart.spec.ts:14` `[aria-label*="Shopping cart"]`). `localStorage.clear()` in beforeEach for isolation.
- **Mocking**: no MSW observed. `jest.mock` for module mocks (jest.setup.js is the global). Tests prefer behavior assertions over implementation mocks.

## Commit format
Conventional commits with prefixes — observed via `git log --oneline -25`:
- `feat:` — new features (`feat: add €3 delivery fee for orders under €35`, `feat: WhatsApp + email notification…`)
- `fix:` — bug fixes (`fix: harden live chat — RLS, rate limiting…`, `fix: add mobile responsive sidebar navigation…`)
- `style:` — visual/design changes, not formatting (`style: sharpen Button component for luxury editorial feel`, `style: update container borders to dark black/grey`)
- No `chore:`, `refactor:`, `docs:`, `test:` observed in recent 25.
- Subject lowercase after prefix, em-dash (`—`) used liberally to add context after the headline. No body/footer in most commits, no Co-Authored-By trailer.
