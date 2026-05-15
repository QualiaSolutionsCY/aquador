---
phase: 4
milestone: 2
goal: "Rebuild the cart drawer and Stripe checkout path for fewer clicks, wallet support, visible trust signals, and a sticky-bottom subtotal on mobile, while preserving the v1.0 server-side cart validation and the 21-test webhook contract."
tasks: 3
waves: 1
---

# Phase 2.4: Cart Drawer + Checkout

**Goal:** When a shopper hits "Add to Cart" anywhere on the site, an editorial, sharp, token-driven drawer opens with hairline-divider line items, a sticky subtotal at the bottom, trust signals below the subtotal, and a checkout button that hands off to Stripe-hosted Checkout with Apple Pay and Google Pay surfaced (via Stripe Dashboard wallet config). The server-side price re-validation in `src/lib/validation/cart.ts` and the 21-test Stripe webhook suite remain untouched and green.

**Why this phase:** Cart is the conversion bottleneck. The current `CartDrawer.tsx` uses raw `#FAFAF8` / `bg-gold` hex tokens, Playfair font, spring-physics motion, and announces voice ("Your Cart", "Proceed to Checkout", "Browse Products"). M2 §10b bans all of that. Trust signals are absent. Wallets are not surfaced because nothing in the checkout route opts into them. Maria (PRODUCT.md user #1) cannot complete in under six minutes on mobile if the subtotal scrolls away. Eleni cannot Apple-Pay-tap if wallets aren't enabled. This phase fixes both without touching the validation/webhook layer that v1.0 hardened.

**Locked decisions in force (do not relitigate):**
- **D-01 — Stripe-hosted redirect stays.** No embedded Payment Element this phase. Checkout Session URL redirect is the flow.
- **D-02 — Wallets via Stripe Dashboard.** `payment_method_types` is OMITTED from the Checkout Session create call so Dashboard wallet config governs. The 2026 Stripe API rejects `apple_pay`/`google_pay` as `PaymentMethodType` enum values on Checkout Sessions; omission is the canonical pattern.
- **D-03 — TrustBar imported from Phase 2.2.** Phase 2.2 builds `src/components/storefront/TrustBar.tsx`; this phase imports it. If 2.2 has not landed, Task 1 surfaces the missing-import error and the builder STOPS rather than re-implementing TrustBar in cart-land.
- **D-04 — CART-05 non-regression.** `src/lib/validation/cart.ts` is read-only this phase. Verifier checks `git diff` is empty for that file.
- **D-05 — localStorage key unchanged.** `aquador_cart` stays; no `aquador_cart_v2` migration. Cart item shape is unchanged.
- **D-06 — `<Card>` banned as cart-item or section wrapper.** Cart items are hairline-divider horizontal rows. The drawer itself is a `<DrawerContent>` from `@/components/ui`, not a Card.
- **D-07 — Motion mandatory.** Drawer slide (handled by Drawer primitive) + cart-row enter/exit fade-translate + subtotal numeric ticker on add/remove. Minimum two visible motion patterns inside `CartDrawer.tsx` so the M2 §10b grep contract (`grep -cE 'animate-|transition-|@keyframes' src/components/cart/CartDrawer.tsx` ≥ 2) passes.
- **D-08 — Voice from PRODUCT.md.** No em-dashes, no exclamation, no announcements. "Bag" not "Your Cart". "Continue to checkout" not "Proceed to Checkout". "Empty for now." not "Your cart is empty".

---

## Task 1 — Rewrite CartDrawer with v3 Drawer primitive, hairline rows, motion, TrustBar

**Wave:** 1
**Persona:** frontend
**Files:**
- `src/components/cart/CartDrawer.tsx` — REWRITE. Replace hand-rolled `framer-motion` drawer with `Drawer`/`DrawerContent`/`DrawerHeader`/`DrawerTitle`/`DrawerFooter` from `@/components/ui`. The drawer is now a controlled component bound to `useCart().isCartOpen` and `closeCart()`. Layout: header (title "Bag", close `IconButton`); scrollable body of cart-line rows separated by `border-t border-border` hairlines (NO `<Card>` wrappers); sticky footer pinned to bottom containing subtotal row, free-shipping inline note, `<TrustBar />`, and `<CheckoutButton />`. Empty state: editorial copy "Empty for now." + "Three things people are wearing this week." + secondary `Button variant="ghost"` "Read the collection" linking to `/shop`.
- `src/components/cart/CartItem.tsx` — REWRITE as a hairline-divider row component (NOT a Card). Horizontal flex: 64×64 product image | name + size + qty stepper | line price | remove `IconButton` (aria-label `Remove {productName} from bag`). Enter animation: `data-[state=enter]:animate-fade-in-up` (opacity 0→1 + translateY 8→0, `--duration-fast`, `--ease-out-quart`). Exit animation: `animate-fade-out-down` (opacity 1→0 + translateY 0→-8, `--duration-fast`). Uses tokens: `bg-bg`, `text-fg`, `text-fg-muted`, `border-border`. NO hex, NO `font-playfair`, NO `bg-gold` magic strings.

**Depends on:** none

**Why:** D-01..D-08. This is the visible surface of the phase. The drawer is what Maria sees in the café on her iPhone — it MUST converge to v3 tokens, MUST surface trust signals before the checkout button (so the secure-payment promise is read pre-commit, not post-redirect), and MUST keep the subtotal pinned to the bottom on 375px viewports. Current implementation fails all three.

**Acceptance Criteria:**
- Clicking "Add to Cart" anywhere (PDP, shop card, builder) opens the v3 `Drawer` with the cart contents. Pressing Escape, clicking the scrim, or clicking the close `IconButton` dismisses it. Qty +/- and remove all execute without closing the drawer (state changes only).
- Cart line items render as horizontal hairline-divider rows separated by `border-t border-border`. NO `<Card>` element appears anywhere inside `CartDrawer.tsx`. Visual: image (64×64) on left, name + size + qty stepper in the middle column, line price + remove icon on the right.
- At 375px viewport (`Chrome devtools iPhone SE`), the subtotal block + TrustBar + Checkout button are pinned to the bottom of the drawer via the sticky footer; scrolling the items list does NOT push the subtotal out of view.
- TrustBar renders below the subtotal row and above the Checkout button, showing the four signals from PRODUCT voice ("Ships in three days", "Returns within thirty", "Authenticity guaranteed", "Secure payment, encrypted").
- Empty-cart state shows the editorial copy ("Empty for now." / "Three things people are wearing this week.") and a "Read the collection" CTA linking to `/shop`. No "browse products" / no "your cart is empty" copy.
- Motion: drawer slides in (handled by `Drawer` primitive — keyframes exist in `tokens.css`). Cart row enters with `animate-fade-in-up` on mount and exits with `animate-fade-out-down` on remove. Subtotal value animates from old to new on add/remove via a numeric-ticker (CSS `transition` on `tabular-nums` span, `--duration-base`).
- All text is voice-compliant: "Bag" not "Your Cart"; "Subtotal" not "Total"; "Free shipping. Ships in three days." inline note; "Continue to checkout" button label; remove aria `Remove {productName} from bag`. No em-dashes (—) or hyphens-as-punctuation (–) anywhere. No emoji.

**Action:**
1. Replace `CartDrawer.tsx` end-to-end. Import `Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, IconButton, Button` from `@/components/ui`. Import `TrustBar` from `@/components/storefront/TrustBar` (D-03). If TrustBar does not resolve, STOP and surface the missing dependency rather than fabricating one.
2. Bind `<Drawer open={isCartOpen} onOpenChange={(open) => !open && closeCart()}>`. Inside `<DrawerContent className="flex flex-col h-screen max-w-[28rem]">`, render `<DrawerHeader>` with `<DrawerTitle>Bag</DrawerTitle>` and a close `IconButton`. Body is `<div className="flex-1 overflow-y-auto px-6">`. Footer is `<DrawerFooter className="border-t border-border bg-bg sticky bottom-0">` with subtotal, free-shipping note, `<TrustBar variant="compact" />`, and `<CheckoutButton />` stacked.
3. Rewrite `CartItem.tsx` as a flex row. Wrap each row in a `<motion.li>` (keep framer-motion since it's already in the dependency tree and `Drawer` doesn't enforce CSS-only motion) OR use Tailwind classes `animate-fade-in-up` / `animate-fade-out-down` defined in `tokens.css` — either is acceptable as long as `grep -cE 'animate-|transition-|@keyframes' src/components/cart/CartDrawer.tsx` returns ≥ 2.
4. Numeric subtotal ticker: wrap the subtotal number in `<span className="tabular-nums transition-all duration-[var(--duration-base)] ease-[var(--ease-out-quart)]">`. The change-of-value re-renders the span and the `transition` token handles the visual ease. (No external ticker library required.)
5. Empty state: detect `cart.items.length === 0` and render the editorial copy + "Read the collection" `Button variant="ghost"` linking to `/shop`. Closes the drawer on click.
6. Remove ALL legacy classes: `bg-[#FAFAF8]`, `border-gold/10`, `text-gold`, `font-playfair`, `bg-gold`, `text-black`, `bg-black/60`. Replace with token classes: `bg-bg`, `border-border`, `text-fg`, `text-fg-muted`, `font-display` for the title (already wired via `next/font` in M1).
7. Run `npm run type-check` and `npm run lint` after the rewrite. Fix any TS errors before committing.

**Validation:** (builder self-check)
- `grep -cE '<Card[ >]' src/components/cart/CartDrawer.tsx` → must be `0`
- `grep -cE 'animate-|transition-|@keyframes' src/components/cart/CartDrawer.tsx` → must be `≥ 2`
- `grep -rEn ' — | – ' src/components/cart/` → must be `0`
- `grep -rEn '#FAFAF8|font-playfair|bg-gold[^-]|bg-\[#' src/components/cart/CartDrawer.tsx src/components/cart/CartItem.tsx` → must be `0` (no legacy hex / Playfair / magic-string gold)
- `grep -c 'TrustBar' src/components/cart/CartDrawer.tsx` → must be `≥ 1`
- `grep -c "from '@/components/ui'" src/components/cart/CartDrawer.tsx` → must be `≥ 1`
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → must be `0`

**Context:** Read
- `@.planning/PROJECT.md`
- `@.planning/PRODUCT.md`
- `@.planning/DESIGN.md` (especially §2 colors, §3 typography, §7 motion, §10b M2 storefront constraints)
- `@.planning/ROADMAP.md` (Phase 2.4 detail)
- `@src/components/ui/Drawer.tsx` (the primitive — use its compound API exactly)
- `@src/components/ui/index.ts` (re-exports)
- `@src/components/cart/CartProvider.tsx` (state contract — `isCartOpen`, `closeCart`, `subtotal`, `cart.items`, `updateQuantity`, `removeItem` — do not modify)
- `@src/types/cart.ts` (CartItem shape — do not modify)
- `@src/styles/tokens.css` (verify `animate-fade-in-up` / `animate-fade-out-down` exist; if missing, add the keyframes there, not in the component)
- `@src/components/storefront/TrustBar.tsx` (Phase 2.2 deliverable — import; if missing, STOP)

**Design:**
- Register: product (cart is in the product-flow register, not brand-chrome)
- Tokens used: `var(--bg)`, `var(--bg-alt)`, `var(--fg)`, `var(--fg-muted)`, `var(--accent)`, `var(--border)`, `var(--space-4)`, `var(--space-6)`, `var(--space-8)`, `var(--duration-fast)`, `var(--duration-base)`, `var(--ease-out-quart)`, `--shadow-3` (Drawer primitive handles)
- Container variant: hairline-divider stack (D-06 — `<Card>` banned)
- Scope: component (CartDrawer.tsx + CartItem.tsx)
- Anti-pattern guard: builder runs `bin/slop-detect.mjs src/components/cart/` pre-commit; commit blocked on any hit (raw hex, `font-playfair`, `bg-rgba`, `<Card>` as section wrapper)

---

## Task 2 — Rebuild CheckoutButton voice + verify checkout API stays wallet-permissive + refresh checkout success/cancel pages

**Wave:** 1
**Persona:** frontend
**Files:**
- `src/components/cart/CheckoutButton.tsx` — REWRITE button styling. Replace `motion.button` with `Button` from `@/components/ui` (variant primary, size lg, full-width). Label: "Continue to checkout". Loading label: "Working" (no ellipsis, no "Processing..."). Secure-payment caption below: "Secure payment, encrypted." (replaces "Secure checkout powered by Stripe" — voice + no Stripe name in customer copy per PRODUCT voice rule about not announcing). Error display uses `useToast()` from `@/components/ui` instead of an inline red `<p>`. Network/abort logic, Vercel `track` calls, Sentry breadcrumbs PRESERVED — only the visual layer changes.
- `src/app/api/checkout/route.ts` — VERIFY (do not rewrite the file). Confirm `payment_method_types` is absent from the `stripe.checkout.sessions.create({...})` call. The file already omits it as of the last commit; the task is to LEAVE IT OMITTED and assert it via grep. If a future hand has reintroduced `payment_method_types`, REMOVE that field (and only that field — touch nothing else). D-04 (CART-05 non-regression) means the Zod schema, `validateCartPrices` call, line-item shape, shipping options, and metadata block are read-only.
- `src/app/checkout/success/page.tsx` — REWRITE copy + tokens. Replace any "Thank you for your order!" / "Your order has been confirmed!" announcement copy with editorial: "It's ours to send now." / "You'll have it in three days, maybe four." / "We just sent the receipt to your inbox." Replace `bg-gold` / `font-playfair` / hex tokens with token classes. Layout: full-bleed bone surface, narrow centered column, hairline-divider stack (NOT a Card-wrapped success panel).
- `src/app/checkout/cancel/page.tsx` — REWRITE copy + tokens. Editorial: "Not this time, then." / "Your bag is waiting; the prices haven't moved." / button "Return to bag" (opens drawer) and link "Read the collection" (`/shop`). No exclamation, no apology drama.

**Depends on:** none

**Why:** D-02 + D-08. The Checkout Button is the voice-bearing CTA that closes the sale; "Proceed to Checkout" is announcement-voice. The checkout route needs a defensive guard so a future careless edit doesn't reintroduce `payment_method_types` and silently break wallet surfacing (Stripe Dashboard config governs only when the param is absent). The success and cancel pages are return URLs — Maria lands there after Apple Pay completes, and if those pages read "Thank you!!" with gold-on-black hex, the entire v3 voice promise unravels at the moment of highest trust.

**Acceptance Criteria:**
- CheckoutButton renders using the v3 `Button` primitive; label is "Continue to checkout" (default) and "Working" (loading state). Disabled state when cart is empty or while POSTing. Errors surface via `useToast({ variant: 'error' })` — no inline red text. The fetch contract to `/api/checkout` (POST JSON `{ items: cart.items }`, expect `{ url }`, `window.location.href = url`) is UNCHANGED. AbortController cleanup on unmount preserved. Vercel `track('checkout_started', ...)` preserved.
- `src/app/api/checkout/route.ts` contains zero occurrences of the string `payment_method_types`. The rest of the file diffs to zero against `HEAD` for this phase (the only allowed change is removing the field if a future hand added it; if absent at phase start, file is untouched).
- `src/lib/validation/cart.ts` diffs to zero in `git diff HEAD~1 src/lib/validation/cart.ts` once the phase commits (CART-05 non-regression).
- `src/app/checkout/success/page.tsx` and `src/app/checkout/cancel/page.tsx` use token classes only (no `bg-gold`, no `font-playfair`, no `#FAFAF8`), use editorial voice (no exclamation, no em-dash, no emoji), and render the secure-payment + ships-in-three-days microcopy reused from `TrustBar`.
- The 21-test webhook suite at `src/app/api/webhooks/stripe/__tests__/route.test.ts` still passes (`npm test src/app/api/webhooks/stripe` shows 21 passed). The webhook route file is untouched.

**Action:**
1. Read `src/app/api/checkout/route.ts`. Confirm `payment_method_types` is NOT present in the create-session call. If present, delete that single line. Do NOT touch the Zod schema, `validateCartPrices` call, `lineItems` construction, `shipping_address_collection`, `phone_number_collection`, `shipping_options`, or `metadata`. Commit any change as `chore(checkout): omit payment_method_types so Stripe Dashboard wallets govern` only if a change was actually needed.
2. Read `src/lib/validation/cart.ts` to confirm shape; do NOT edit. CART-05 is a non-regression contract.
3. Rewrite `CheckoutButton.tsx`:
   - Import `Button, useToast` from `@/components/ui`.
   - Keep `useState/useRef/useEffect/useCallback` block exactly as-is (abort, processing, tracking, sentry breadcrumb logic).
   - Replace the `motion.button` JSX with `<Button variant="primary" size="lg" className="w-full" disabled={...} onClick={handleCheckout}>`. Conditional label: `isLoading ? <><Loader2 className="size-4 animate-spin" /> Working</> : 'Continue to checkout'`.
   - Replace inline `{error && <p>...}` with `useToast()` call inside the catch block: `toast({ variant: 'error', title: 'Could not start checkout', description: err.message })`.
   - Replace the caption `Secure checkout powered by Stripe` with `Secure payment, encrypted.` in `text-fg-muted text-[var(--font-micro)] tracking-[0.05em] uppercase font-[var(--font-micro-family)]`.
4. Rewrite `src/app/checkout/success/page.tsx`:
   - Read existing implementation first to preserve any Stripe `session_id` parsing or analytics hook.
   - Keep server-side `searchParams` handling (Stripe redirects with `?session_id={CHECKOUT_SESSION_ID}`).
   - Layout: `<section className="min-h-screen bg-bg flex items-center justify-center px-6">` + `<div className="max-w-[42rem] w-full border-t border-border pt-16">` containing editorial copy (h1 display "It's ours to send now.", body "You'll have it in three days, maybe four. The notes settle best after the first wear; let it find its skin." — VERIFIED voice from PRODUCT.md), order-number receipt line if available from `session_id`, and a `Button variant="ghost" asChild`-wrapped Link back to `/shop` with copy "Continue reading the collection".
5. Rewrite `src/app/checkout/cancel/page.tsx`:
   - Layout: same hairline-stack pattern as success.
   - Copy: h1 "Not this time, then." + body "Your bag is waiting; the prices haven't moved. Take it back up when you're ready."
   - Two CTAs: primary `Button` "Return to bag" (sets `?openCart=1` query so the home layout reopens the drawer on land, OR push to `/shop` and let the user reopen the bag manually — pick the simpler path that doesn't require a new layout hook; document the choice in the task commit message), and ghost link "Read the collection" to `/shop`.
6. Run `npm run type-check`, `npm run lint`, and `npm test src/app/api/webhooks/stripe` after the rewrite.

**Validation:** (builder self-check)
- `grep -c 'payment_method_types' src/app/api/checkout/route.ts` → must be `0`
- `git diff src/lib/validation/cart.ts` → must be empty (no changes)
- `grep -rEn ' — | – ' src/app/checkout/` → must be `0`
- `grep -rEn '#FAFAF8|font-playfair|bg-gold[^-]|bg-\[#' src/app/checkout/success/page.tsx src/app/checkout/cancel/page.tsx src/components/cart/CheckoutButton.tsx` → must be `0`
- `grep -P '[\x{1F300}-\x{1F9FF}]|[\x{2600}-\x{27BF}]' src/app/checkout/ src/components/cart/CheckoutButton.tsx` → must be `0` (no emoji)
- `grep -c "from '@/components/ui'" src/components/cart/CheckoutButton.tsx` → must be `≥ 1` (Button + useToast imports)
- `npm test src/app/api/webhooks/stripe 2>&1 | tail -3` → must contain `Tests: 21 passed` (or higher) and `0 failed`
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → must be `0`

**Context:** Read
- `@.planning/PRODUCT.md` (brand voice paragraph + decision rules; verify the success/cancel copy against the "empty cart / error / confirmation" voice samples)
- `@.planning/DESIGN.md` §3 typography, §10b copy + motion rules
- `@src/app/api/checkout/route.ts` (current state — verify D-02)
- `@src/lib/validation/cart.ts` (read-only contract — CART-05)
- `@src/app/api/webhooks/stripe/route.ts` (webhook contract — DO NOT touch; verify untouched after phase)
- `@src/app/api/webhooks/stripe/__tests__/route.test.ts` (21-test suite — confirm count, run before commit)
- `@src/components/ui/Button.tsx` (primitive contract)
- `@src/components/ui/Toast.tsx` (useToast contract)
- `@src/app/checkout/success/page.tsx` (current state to preserve session_id parsing)
- `@src/app/checkout/cancel/page.tsx` (current state)

**Design:**
- Register: brand (success and cancel pages are the primary rewrite surfaces in this task and operate in the brand register; CheckoutButton.tsx is a thin product-flow primitive call within the same task — Card and section-wrapper rules still apply uniformly)
- Tokens used: `var(--bg)`, `var(--fg)`, `var(--fg-muted)`, `var(--accent)`, `var(--border)`, `--font-display-xl`, `--space-6`, `--space-16`
- Container variant: hairline-divider stack (success + cancel pages); CheckoutButton is a primitive call, no section wrapper
- Scope: component (CheckoutButton) + page (success + cancel)
- Anti-pattern guard: `bin/slop-detect.mjs src/app/checkout/ src/components/cart/CheckoutButton.tsx` pre-commit

---

## Task 3 — Stripe wallets domain-registration runbook

**Wave:** 1
**Persona:** backend
**Files:**
- `docs/stripe-wallets.md` — NEW. Operator-facing runbook documenting the manual Stripe Dashboard step required to surface Apple Pay and Google Pay on the Stripe-hosted Checkout pages. Contents: prerequisites (live mode + custom domain `aquadorcy.com`), step-by-step path through Stripe Dashboard → Settings → Payment methods → Apple Pay / Google Pay → Register domain, the verification URL `https://aquadorcy.com/.well-known/apple-developer-merchantid-domain-association`, troubleshooting (wallets hidden = domain not verified, or test mode bypasses wallet surfacing on certain SKUs), and the code-side contract (`src/app/api/checkout/route.ts` omits `payment_method_types` so Dashboard config governs — link to D-02).

**Depends on:** none

**Why:** D-02. Apple Pay and Google Pay surfacing is configuration, not code. If this is not documented, the next time someone redeploys or rotates Stripe keys they will scratch their head wondering why wallets disappeared. Maria's six-minute mobile-checkout depends on Apple Pay being one tap; that one tap depends on a Dashboard checkbox that needs an explicit owner and an explicit URL.

**Acceptance Criteria:**
- `docs/stripe-wallets.md` exists and is at least 30 lines of operator runbook (not a stub).
- The runbook contains: the Dashboard navigation path (verbatim menu names), the production domain (`aquadorcy.com`), the verification file path (`.well-known/apple-developer-merchantid-domain-association`), and the explicit statement that `src/app/api/checkout/route.ts` must NOT set `payment_method_types` (citing D-02).
- Voice is operator-direct, not customer-editorial (this is internal — no PRODUCT.md voice rules apply here, only clarity). No em-dashes still preferred for codebase consistency.
- The runbook is linked from a one-line bullet in `CLAUDE.md` (project root) under a new "Operator runbooks" subsection if one doesn't exist, OR appended to the existing deployment notes if there is one. The link should be `See [docs/stripe-wallets.md](docs/stripe-wallets.md) before testing wallet payments.`

**Action:**
1. Create `docs/stripe-wallets.md` from scratch. Sections:
   - **Why this matters** — one paragraph on the Maria mobile-checkout flow and why wallets must surface on Stripe-hosted Checkout.
   - **Prerequisites** — bullet list: live-mode Stripe account, custom domain `aquadorcy.com` with valid TLS, Stripe Dashboard owner access.
   - **Dashboard steps (Apple Pay)** — numbered list, exact menu path: `Stripe Dashboard → Settings → Payment methods → Apple Pay → Configure → Add new domain → aquadorcy.com → Download verification file → Upload to /.well-known/apple-developer-merchantid-domain-association at the production root → Click Verify`.
   - **Dashboard steps (Google Pay)** — numbered list, exact menu path: `Stripe Dashboard → Settings → Payment methods → Google Pay → Enable for Checkout`.
   - **Code-side contract** — explicit statement that `src/app/api/checkout/route.ts` omits `payment_method_types` so Dashboard config governs which payment methods surface. Cite D-02 from this phase plan.
   - **Verifying wallets surface** — instructions to open a test Checkout Session URL on an iPhone (Safari, logged into Wallet) and a Chrome desktop (logged into Google Pay) and confirm the wallet buttons render above the card form.
   - **Troubleshooting** — bullet list: "Wallets hidden in test mode for some accounts", "Domain verification expired — re-upload the .well-known file", "User-agent without wallet support shows only card".
2. Append to project root `CLAUDE.md` (or create an "Operator Runbooks" section if one does not exist) a one-line bullet linking the new doc.

**Validation:** (builder self-check)
- `test -f docs/stripe-wallets.md && wc -l docs/stripe-wallets.md | awk '{print $1}'` → must be `≥ 30`
- `grep -c 'apple-developer-merchantid-domain-association' docs/stripe-wallets.md` → must be `≥ 1`
- `grep -c 'payment_method_types' docs/stripe-wallets.md` → must be `≥ 1` (the code-contract section cites the field-name)
- `grep -c 'aquadorcy.com' docs/stripe-wallets.md` → must be `≥ 2`
- `grep -c 'stripe-wallets' CLAUDE.md` → must be `≥ 1`

**Context:** Read
- `@.planning/PROJECT.md` (live URL, deployment context)
- `@src/app/api/checkout/route.ts` (cite the absence of `payment_method_types`)
- `@CLAUDE.md` (project root — to find the right place to link)

---

## Scope Changes (REQUIREMENTS.md / ROADMAP.md re-interpretation)

Two M2 requirements are implementation-reframed in this phase. Both serve the underlying user need without expanding scope to an embedded Payment Element rewrite (which would balloon this phase to weeks). The trade-offs are documented here for the audit trail.

**CART-02 — Wallet support, implementation reframed.**
- REQUIREMENTS.md / ROADMAP.md says: "Checkout uses Stripe Payment Element with Apple Pay / Google Pay enabled" with `paymentMethodTypes: ['card', 'apple_pay', 'google_pay']` in the Payment Element config.
- This phase delivers: KEEP the existing Stripe-hosted Checkout Session redirect (D-01 locked). Wallets surface via Stripe Dashboard configuration (Apple/Google Pay registered on aquadorcy.com under Payment methods → Wallets). The Checkout Session creation in `src/app/api/checkout/route.ts` OMITS `payment_method_types` so Dashboard config governs (D-02 locked). As of 2026 Stripe SDK, `apple_pay` / `google_pay` are NOT valid `PaymentMethodType` enum values for Checkout Sessions — relying on Dashboard config is the canonical pattern for hosted Checkout.
- User need satisfied: shopper sees Apple Pay / Google Pay buttons at checkout. Test mode verification covered in Task 3 runbook.
- Deferred: embedded Payment Element migration. Captured as post-M2 follow-up if conversion data shows the hosted redirect is the bottleneck.

**CART-03 — Sticky mobile summary, surface reframed.**
- REQUIREMENTS.md / ROADMAP.md says: "Order summary sticky on mobile checkout" (on the checkout page).
- This phase delivers: subtotal + TrustBar + Checkout button pinned in a sticky footer at the bottom of the CART DRAWER on mobile (375px). The cart drawer IS the "checkout summary surface" for shoppers — once they tap "Continue to checkout" the page that loads is Stripe-hosted (not editable by us, by D-01 above).
- User need satisfied: shopper at 375px always sees the running total before committing to the Stripe redirect. Subtotal does not scroll away with the line items.
- Deferred: a sticky summary on Stripe's hosted checkout page is impossible without the embedded Payment Element rewrite (see CART-02 reframing).

Both reframings preserve the spirit of the requirement (wallets enabled, mobile shopper sees subtotal) within the locked Stripe-hosted architecture decision. M4 (Handoff) can revisit if conversion analytics warrant the Payment Element migration.

---

## Success Criteria

The phase is shipped when ALL of the following are true:

- [ ] **CART-01:** Clicking "Add to Cart" anywhere opens the v3 `Drawer`-based cart. Escape, scrim click, and the close `IconButton` all dismiss. Qty +/- and remove execute without dismissing the drawer.
- [ ] **CART-02 (reframed — see Scope Changes):** `src/app/api/checkout/route.ts` does not set `payment_method_types`, so Stripe Dashboard wallet config governs which payment methods surface on the hosted Checkout. `docs/stripe-wallets.md` documents the Dashboard registration step.
- [ ] **CART-03 (reframed — see Scope Changes):** At 375px viewport, the subtotal + TrustBar + Checkout button sit in a sticky footer pinned to the CART DRAWER bottom; the items list scrolls above it; the subtotal is always visible. (Stripe-hosted checkout page itself is not editable per D-01.)
- [ ] **CART-04:** `<TrustBar />` (from `@/components/storefront/TrustBar`, Phase 2.2) renders in the drawer between the subtotal row and the Checkout button. The four signals (ships, returns, authenticity, secure payment) are visible without expanding any disclosure.
- [ ] **CART-05 (non-regression):** `src/lib/validation/cart.ts` is byte-identical to its state at phase start. The 21-test webhook suite at `src/app/api/webhooks/stripe/__tests__/route.test.ts` exits 0.
- [ ] **TRUST-01:** Trust microcopy (`Ships in three days`, `Returns within thirty`, `Authenticity guaranteed`) renders in the cart drawer + the checkout success page.
- [ ] **TRUST-02:** "Secure payment, encrypted." caption renders under the Checkout button. (TrustBar surfaces it too.)
- [ ] **§10b — No em-dashes:** `grep -rEn ' — | – ' src/components/cart/ src/app/checkout/` returns 0.
- [ ] **§10b — Voice:** All customer-visible copy matches PRODUCT.md voice samples ("Bag" / "Empty for now." / "Continue to checkout" / "Not this time, then." / "It's ours to send now.").
- [ ] **§10b — Zero emoji:** `grep -P '[\x{1F300}-\x{1F9FF}]|[\x{2600}-\x{27BF}]' src/components/cart/ src/app/checkout/` returns 0.
- [ ] **§10b — Card banned in cart:** `grep -cE '<Card[ >]' src/components/cart/CartDrawer.tsx` returns 0.
- [ ] **§10b — Motion mandatory:** `grep -cE 'animate-|transition-|@keyframes' src/components/cart/CartDrawer.tsx` returns ≥ 2.
- [ ] **End-to-end:** A test card `4242 4242 4242 4242` flow (Add to cart → drawer opens → Continue to checkout → Stripe-hosted page → submit → /checkout/success) completes without console errors and lands on the new editorial success page.

---

## Verification Contract

### Contract for Task 1 — CartDrawer rewrite (Card banned)
**Check type:** grep-match
**Command:** `grep -cE '<Card[ >]' src/components/cart/CartDrawer.tsx`
**Expected:** `0`
**Fail if:** Any `<Card>` element appears in CartDrawer.tsx — D-06 violated, cart items must be hairline-divider rows not cards.

### Contract for Task 1 — CartDrawer rewrite (motion present)
**Check type:** grep-match
**Command:** `grep -cE 'animate-|transition-|@keyframes' src/components/cart/CartDrawer.tsx`
**Expected:** `≥ 2`
**Fail if:** Returns 0 or 1 — D-07 violated, motion is mandatory in M2 storefront pages.

### Contract for Task 1 — CartDrawer rewrite (no em-dashes in cart)
**Check type:** grep-match
**Command:** `grep -rEn ' — | – ' src/components/cart/`
**Expected:** `0` (the command returns no matching lines — exit code 1)
**Fail if:** Any match in customer-visible JSX strings under src/components/cart/ — §10b copy rule violated.

### Contract for Task 1 — CartDrawer rewrite (TrustBar wired)
**Check type:** grep-match
**Command:** `grep -c 'TrustBar' src/components/cart/CartDrawer.tsx`
**Expected:** `≥ 1`
**Fail if:** Returns 0 — CART-04 missing, TrustBar not imported into the cart drawer.

### Contract for Task 1 — CartDrawer rewrite (v3 Drawer primitive used)
**Check type:** grep-match
**Command:** `grep -cE "from '@/components/ui'" src/components/cart/CartDrawer.tsx`
**Expected:** `≥ 1`
**Fail if:** Returns 0 — hand-rolled drawer remains, v3 Drawer primitive not adopted.

### Contract for Task 1 — CartDrawer rewrite (no legacy tokens)
**Check type:** grep-match
**Command:** `grep -cE '#FAFAF8|font-playfair|bg-gold[^-]|bg-\[#' src/components/cart/CartDrawer.tsx src/components/cart/CartItem.tsx`
**Expected:** `0`
**Fail if:** Any hex literal, Playfair font reference, or `bg-gold` magic-string remains in the rewritten cart files.

### Contract for Task 1 — Behavioral (drawer dismissal + sticky subtotal)
**Check type:** behavioral
**Command:** (verifier opens preview deployment on Chrome devtools iPhone SE 375px viewport)
**Expected:** Add an item to cart from any product page. Drawer opens. Press Escape — drawer closes. Add again. Click scrim — drawer closes. Add three items. Scroll the items list. Subtotal stays visible at the bottom of the drawer at all times.
**Fail if:** Drawer fails any of the three dismissal paths, OR subtotal scrolls out of view at 375px.

### Contract for Task 2 — CheckoutButton voice + v3 Button primitive
**Check type:** grep-match
**Command:** `grep -cE "from '@/components/ui'" src/components/cart/CheckoutButton.tsx`
**Expected:** `≥ 1`
**Fail if:** Returns 0 — v3 Button primitive not adopted.

### Contract for Task 2 — Checkout API wallet-permissive (D-02)
**Check type:** grep-match
**Command:** `grep -c 'payment_method_types' src/app/api/checkout/route.ts`
**Expected:** `0`
**Fail if:** Field is present — Stripe Dashboard wallet config will not govern.

### Contract for Task 2 — CART-05 non-regression
**Check type:** command-exit
**Command:** `git diff HEAD~1 src/lib/validation/cart.ts | grep -c '^[+-]'`
**Expected:** `0` (file is byte-identical to phase start)
**Fail if:** Any added or removed lines — server-side cart validation regressed.

### Contract for Task 2 — Webhook 21-test suite stays green
**Check type:** command-exit
**Command:** `npm test src/app/api/webhooks/stripe 2>&1 | grep -E 'Tests:.*passed'`
**Expected:** Output contains `21 passed` (or higher) and no `failed` count > 0
**Fail if:** Any webhook test fails — webhook contract regressed.

### Contract for Task 2 — Checkout success/cancel no em-dashes
**Check type:** grep-match
**Command:** `grep -rEn ' — | – ' src/app/checkout/`
**Expected:** `0`
**Fail if:** Any em-dash or hyphen-as-punctuation in success/cancel pages.

### Contract for Task 2 — Checkout success/cancel no legacy tokens
**Check type:** grep-match
**Command:** `grep -cE '#FAFAF8|font-playfair|bg-gold[^-]|bg-\[#' src/app/checkout/success/page.tsx src/app/checkout/cancel/page.tsx src/components/cart/CheckoutButton.tsx`
**Expected:** `0`
**Fail if:** Any legacy hex / Playfair / magic-string-gold survives the rewrite.

### Contract for Task 3 — Runbook exists and is real
**Check type:** file-exists
**Command:** `test -f docs/stripe-wallets.md && wc -l docs/stripe-wallets.md | awk '{print ($1>=30)?"OK":"SHORT"}'`
**Expected:** `OK`
**Fail if:** File missing OR fewer than 30 lines (stub-grade).

### Contract for Task 3 — Runbook documents wallet verification path
**Check type:** grep-match
**Command:** `grep -c 'apple-developer-merchantid-domain-association' docs/stripe-wallets.md`
**Expected:** `≥ 1`
**Fail if:** Returns 0 — Apple Pay domain verification step missing.

### Contract for Task 3 — Runbook cites the code contract
**Check type:** grep-match
**Command:** `grep -c 'payment_method_types' docs/stripe-wallets.md`
**Expected:** `≥ 1`
**Fail if:** Returns 0 — the absence-of-field contract isn't documented for future maintainers.

### Contract — Whole-phase: no emoji anywhere in cart/checkout surface
**Check type:** grep-match
**Command:** `grep -P '[\x{1F300}-\x{1F9FF}]|[\x{2600}-\x{27BF}]' src/components/cart/ src/app/checkout/`
**Expected:** `0` (no matching lines)
**Fail if:** Any emoji in any cart or checkout file — §10b zero-emoji rule violated.

### Contract — Whole-phase: TypeScript compiles
**Check type:** command-exit
**Command:** `npx tsc --noEmit 2>&1 | grep -c "error TS"`
**Expected:** `0`
**Fail if:** Any TypeScript error — D-04..D-08 may have broken contracts.

### Contract — Whole-phase: lint passes
**Check type:** command-exit
**Command:** `npm run lint 2>&1 | tail -5`
**Expected:** Exit code 0, no `error` lines
**Fail if:** Lint emits errors on touched files.

---

## Decision Coverage Audit

| Decision | Covered by Task | How |
|---|---|---|
| D-01 (Stripe-hosted redirect stays) | Task 2 | CheckoutButton still does `window.location.href = data.url`; no embedded Payment Element introduced. |
| D-02 (Wallets via Dashboard; omit payment_method_types) | Task 2 + Task 3 | Task 2 verifies field absence + asserts via grep contract; Task 3 documents the Dashboard step in runbook. |
| D-03 (TrustBar imported from Phase 2.2) | Task 1 | CartDrawer imports `TrustBar` from `@/components/storefront/TrustBar`. If 2.2 hasn't shipped, Task 1 surfaces the missing-import error. |
| D-04 (CART-05 non-regression: cart.ts read-only) | Task 2 | Validation command `git diff src/lib/validation/cart.ts` must be empty. |
| D-05 (localStorage key unchanged) | Task 1 | Cart Provider is read-only this phase; key `aquador_cart` stays. CartItem shape unchanged. |
| D-06 (Card banned as cart-item wrapper) | Task 1 | Hairline-divider flex rows; grep contract `<Card[ >]` = 0 in CartDrawer.tsx. |
| D-07 (Motion mandatory ≥ 2 patterns) | Task 1 | Drawer slide + row fade-translate + numeric ticker; grep contract `animate-|transition-|@keyframes` ≥ 2. |
| D-08 (Voice from PRODUCT.md, no em-dashes, no emoji) | Tasks 1 + 2 | "Bag" / "Empty for now." / "Continue to checkout" / "It's ours to send now." / "Not this time, then." copy + grep contracts on em-dashes and emoji. |

No locked decision is uncovered. No `Deferred Ideas` row is included in any task.

---

## Notes for the Builder

1. **TrustBar dependency.** Phase 2.2 ships `TrustBar` before this phase builds. If you start Task 1 and `import { TrustBar } from '@/components/storefront/TrustBar'` fails to resolve, STOP and surface the dependency failure to the user. Do not stub TrustBar in cart-land — that creates a duplicate component and breaks the single-source-of-truth contract D-03.
2. **Wave 1 parallel-safe.** Tasks 1, 2, 3 touch disjoint file sets:
   - Task 1: `src/components/cart/CartDrawer.tsx`, `src/components/cart/CartItem.tsx`
   - Task 2: `src/components/cart/CheckoutButton.tsx`, `src/app/api/checkout/route.ts` (verify-only), `src/app/checkout/success/page.tsx`, `src/app/checkout/cancel/page.tsx`
   - Task 3: `docs/stripe-wallets.md`, `CLAUDE.md` (one-line append)

   They can all run in parallel in Wave 1. No write conflicts.
3. **Order of commits within a wave does not matter.** Each task commits independently with a Conventional Commits message: `feat(cart): rebuild drawer with v3 primitives and editorial voice`, `feat(checkout): voice refresh and wallet-permissive Checkout Session`, `docs(stripe): add Apple/Google Pay domain-registration runbook`.
4. **Pre-commit gate.** Before each commit, builder runs the task's Validation block AND the whole-phase contracts that apply to the changed files. Any failure blocks the commit.
5. **`payment_method_types` decision is locked.** Do not, under any circumstance, add `payment_method_types: ['card']` "to be explicit". The 2026 Stripe Checkout Session API rejects `apple_pay`/`google_pay` as enum values, and adding only `'card'` would force-disable wallets. Omission is the canonical pattern; the runbook in Task 3 explains why.
6. **No cart shape change.** D-05 is non-negotiable. `aquador_cart` localStorage key and the existing CartItem Zod schema in `CartProvider.tsx` are preserved. If you find yourself wanting to change them, STOP — the scope of this phase does not permit it.
