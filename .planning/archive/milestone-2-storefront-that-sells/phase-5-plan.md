---
phase: 5
milestone: 2
goal: "Rebuild the 979-LOC create-perfume monolith into a clearly-separated multi-step flow, and deploy the AI concierge as a persistent streaming drawer that knows the catalog and the current cart."
tasks: 4
waves: 3
requirements: [CREATE-01, CREATE-02, CREATE-03, CREATE-04, AI-01, AI-02, AI-03]
---

# Phase 2.5: Builder + AI Concierge

**Goal:** Rebuild `src/app/create-perfume/page.tsx` (979 LOC monolith) into a thin step-router (≤ 150 LOC) plus four supporting files (each ≤ 300 LOC) wired through a `useBuilderState` hook; preserve the Stripe PaymentIntent contract and the `create-perfume/success/` routing verbatim. Ship `AiConciergeDrawer` as a session-persistent streaming concierge that serializes the active cart into every request and renders named-product picks linked to PDPs. Editorial-luxury throughout: numbered editorial layout on the builder, hairline-divider inline thread in the drawer, zero em-dashes, zero emoji, zero `<Card>` as section wrapper.

**Why this phase:** Closes Milestone 2. The 979-LOC builder is the single largest readability liability in the storefront and blocks every future builder feature (gifting, sample-tier, packaging). The concierge is the seduction surface that converts browse-mode buyers (Khaled persona) without a sales-floor tone. Both must ship together because the concierge needs the cart context that only materialises once cart UX is stable (Phase 2.4) and the builder needs the same primitives the concierge consumes (Drawer, Toast, streaming patterns). After this phase, M2 exit criteria are met and the storefront ships.

---

## Task 1 — Rebuild the builder: extract `useBuilderState` then split the monolith

**Wave:** 1
**Persona:** frontend
**Files:**
- `src/app/create-perfume/page.tsx` — REWRITE (current 979 LOC → ≤ 150 LOC). Becomes a thin step-router that reads from `useBuilderState`, renders the numbered editorial layout shell (`01 / 02 / 03 / 04 / 05`), and delegates each step's body to a child component.
- `src/app/create-perfume/_hooks/useBuilderState.ts` — NEW. Exports `useBuilderState()` returning `{ step, setStep, selections: { top: string[]; heart: string[]; base: string[] }, toggleNote, volume: 50 | 100, setVolume, totalCents, validation, canAdvance, reset }`. Internally consumes `fragranceDatabase` and `validateComposition` from `src/lib/perfume/` and `calculatePrice` from `src/lib/perfume/pricing.ts`. State via `useReducer`. ZERO duplication of domain logic; this hook is the only call site for `validateComposition` outside the validator itself.
- `src/app/create-perfume/StepSelector.tsx` — NEW. Renders note picker for the active layer. Props: `{ layer: 'top' | 'heart' | 'base'; selected: string[]; onToggle: (note: string) => void; min: number; max: number }`. Layout: hairline-divider stack (`border-t border-border`) between note groups, `Tag` chips for available notes, `Checkbox` (heart) or `RadioGroup` (top/base where single-family-leaning) per layer. Reads notes via `fragranceDatabase[layer]`.
- `src/app/create-perfume/SummaryPanel.tsx` — NEW. Persistent right column. Type-led layout: large `--font-display-xl` headline = "Your composition" + a paragraph rendering the selected notes inline as prose ("Bergamot and pink pepper over rose and oud, finished with sandalwood."). Price block uses `NumericTicker` (see Design below). NOT a `<Card>` — flat surface on `--bg`, hairline `border-l border-border pl-8` on desktop.
- `src/app/create-perfume/VolumeSelect.tsx` — NEW. `RadioGroup` (50ml / 100ml). Each option shows price (€29.99 / €199.00) sourced from `calculatePrice` in `src/lib/perfume/pricing.ts`. Hairline divider between options. NOT cards.
- `src/app/create-perfume/PaymentStep.tsx` — NEW. Thin Stripe Elements wrapper. Reads the composition + volume from `useBuilderState`, POSTs to `/api/create-perfume/payment` to mint a `clientSecret`, renders Stripe `PaymentElement`, on success Stripe redirects to `/create-perfume/success?payment_intent=...&payment_intent_client_secret=...`. THIS URL PATTERN MUST BE BYTE-IDENTICAL to current `create-perfume/success/page.tsx` detection. No change to API contract or metadata shape.

**Depends on:** none

**Why:** The 979-LOC monolith is the single largest readability liability in `src/app/` and CREATE-01 mandates ≤ 300 LOC per file with the page.tsx itself ≤ 150 LOC. Extract `useBuilderState` FIRST (locked decision: state-first refactor) — splitting render before extracting state results in prop-drilling spaghetti per the roadmap risk note. Numbered editorial layout (01 / 02 / 03 / 04 / 05) is the one approved §10b container variant for this page; `<Card>` as section wrapper is BANNED. `src/lib/perfume/` is READ-ONLY — the hook IMPORTS the validator and database; it does not re-implement them.

**Acceptance Criteria:**
- Shopper lands on `/create-perfume`, sees five numbered editorial sections (`01 / Top notes`, `02 / Heart notes`, `03 / Base notes`, `04 / How much`, `05 / Read it back`) stacked with hairline dividers, no `<Card>` boxes wrapping any section.
- Selecting/deselecting any note in any layer updates the `SummaryPanel` headline and price within `--duration-base` (price animates via numeric ticker from old → new value).
- At step 03 (base notes), the SummaryPanel still shows the user's previously-selected top and heart notes inline as prose plus the running total, without the user having to scroll or navigate back.
- Submitting through `PaymentStep` with Stripe test card `4242 4242 4242 4242` redirects to `/create-perfume/success?payment_intent=...&payment_intent_client_secret=...` and the existing success page detects the PaymentIntent correctly (no regression — verifier diffs the success page detection logic).
- `fragranceDatabase` and `validateComposition` are imported from `src/lib/perfume/` unchanged; `git diff HEAD~1 src/lib/perfume/` returns zero diff after the task commit.
- Every interactive element supports hover/focus/disabled/loading states using motion tokens from `tokens.css` (`--duration-fast`, `--ease-out-quart`); `prefers-reduced-motion: reduce` zeros animations.
- All voice strings match the locked samples in `<phase_details>` (no em-dashes, no hyphens-as-punctuation, no emoji, restrained editorial register).

**Action:**
1. Read `src/app/create-perfume/page.tsx` (the current 979-LOC monolith) in full. Identify: (a) the state shape (current step, selected notes per layer, volume, validation flags), (b) every place that mutates state, (c) every place that reads `fragranceDatabase` or calls `validateComposition` or `calculatePrice`.
2. Create `src/app/create-perfume/_hooks/useBuilderState.ts`. Define `BuilderState` and `BuilderAction` types. Implement a `useReducer` with actions: `TOGGLE_NOTE`, `SET_STEP`, `SET_VOLUME`, `RESET`. The hook computes `totalCents` by calling `calculatePrice({ volume })` from `src/lib/perfume/pricing.ts` on every render (memo via `useMemo`). It computes `validation` by calling `validateComposition({ top, heart, base })` from `src/lib/perfume/composition.ts`. `canAdvance` is `validation.isValid` for the current step's layer. Export `useBuilderState` as the single named export plus a `BuilderProvider` if context is needed across the step components (prefer a single hook + prop-down for clarity).
3. Create `src/app/create-perfume/StepSelector.tsx`. Props as specified above. Render `fragranceDatabase[layer]` as `<Tag>` chips inside a hairline-divider stack. Selected chips get `data-selected="true"` and styled via `var(--accent)` background. Enforce min/max via the `disabled` prop on `Tag` when `selected.length >= max`. Eyebrow micro-label (`font-micro uppercase tracking-[0.05em] text-fg-muted`) reads `0{1|2|3} / {Top|Heart|Base} notes`. Below it: a short editorial line from the voice samples ("The first thing anyone smells. Pick two or three.").
4. Create `src/app/create-perfume/SummaryPanel.tsx`. Renders a `var(--font-display-xl)` headline "Your composition", a prose paragraph that interpolates the selected note names with commas (NEVER em-dashes — use periods and commas only). Below the prose: a 1px hairline divider, then a `font-micro` label "Total" and a `<NumericTicker value={totalCents / 100} format="eur" />` (implement `NumericTicker` inline within this file — it's a 30-LOC sub-component that animates from previous to current value over `--duration-base` using `requestAnimationFrame`; respect `prefers-reduced-motion`). NO `<Card>` wrapper. Sticky on desktop via `position: sticky; top: var(--space-16)`. Mobile: collapses into a sticky bottom bar with subtotal + step indicator.
5. Create `src/app/create-perfume/VolumeSelect.tsx`. Two `<Radio>` rows with `<hr class="border-border">` between them. Each row: volume label ("50 ml" / "100 ml") on the left in `--font-h3`, price on the right in `--font-body-lg` with `var(--accent-deep)` color, a one-line editorial caption below ("Fifty millilitres for daily." / "One hundred for the shelf."). Price values come from `calculatePrice({ volume })` — never hardcode.
6. Create `src/app/create-perfume/PaymentStep.tsx`. On mount, POST `{ top, heart, base, volume, totalCents }` to `/api/create-perfume/payment` to receive `{ clientSecret }`. Wrap `<Elements>` with the publishable key from `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`. Render `<PaymentElement />` + a primary `<Button>` "Continue to payment". On submit, call `stripe.confirmPayment({ elements, confirmParams: { return_url: \`${window.location.origin}/create-perfume/success\` } })`. DO NOT alter the success URL pattern — the success page detects `payment_intent_client_secret` from the URL query string. On error, fire a `Toast` with the error voice sample ("We couldn't reach the desk. Try again.").
7. Rewrite `src/app/create-perfume/page.tsx` as a thin step-router. Top of the file: eyebrow "Three layers, four hours, one perfume." + an `<h1>` "Build a perfume". The body is a two-column layout on `md+` (`grid grid-cols-1 md:grid-cols-[1fr_360px] gap-12`): left column is the active step's component, right column is `<SummaryPanel />`. The five steps are rendered as a vertical stack (one visible at a time, or all five rendered with the inactive ones at reduced opacity — pick the cleaner UX). Use `IntersectionObserver` to fade-up each step body as the user advances. Total page.tsx LOC: ≤ 150.
8. Verify no `<Card>` is used as a section wrapper in any of the five new files. Cards may appear once or twice TOTAL across the page+children for genuine interior content tiles (e.g. a single quote block) — never as the default section container.

**Validation:** (builder self-check, run before committing)
- `wc -l src/app/create-perfume/page.tsx` → ≤ 150
- `find src/app/create-perfume -name "*.tsx" -not -path "*/success/*" -exec wc -l {} \;` → every file ≤ 300
- `git diff HEAD~1 -- src/lib/perfume/ | wc -l` → 0 (verifies READ-ONLY)
- `grep -rEn ' — | – ' src/app/create-perfume/` → 0 matches
- `grep -cE '<Card[ >]' src/app/create-perfume/page.tsx src/app/create-perfume/StepSelector.tsx src/app/create-perfume/SummaryPanel.tsx src/app/create-perfume/VolumeSelect.tsx src/app/create-perfume/PaymentStep.tsx` → ≤ 2
- `grep -cE 'animate-|transition-|@keyframes|IntersectionObserver' src/app/create-perfume/` → ≥ 3
- `grep -P '[\x{1F300}-\x{1F9FF}]|[\x{2600}-\x{27BF}]' -r src/app/create-perfume/` → 0
- `grep -c 'fragranceDatabase\|validateComposition\|calculatePrice' src/app/create-perfume/_hooks/useBuilderState.ts` → ≥ 3
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → 0
- `npm run lint 2>&1 | tail -5` → no errors in `src/app/create-perfume/`
- `diff <(git show HEAD~1:src/app/create-perfume/success/page.tsx) src/app/create-perfume/success/page.tsx` → empty (success page UNCHANGED)

**Context:** Read
- `@.planning/PRODUCT.md` (brand voice, anti-references)
- `@.planning/DESIGN.md` §10b especially (M2 storefront constraints, container vocabulary, motion patterns)
- `@.planning/ROADMAP.md` Phase 2.5 section (locked decisions, risks)
- `@src/lib/perfume/types.ts` (FragranceNote, PerfumeComposition, CustomPerfume shapes)
- `@src/lib/perfume/notes.ts` (`fragranceDatabase` shape — DO NOT modify)
- `@src/lib/perfume/composition.ts` (`validateComposition` signature)
- `@src/lib/perfume/pricing.ts` (`calculatePrice`)
- `@src/app/create-perfume/page.tsx` (the 979-LOC monolith — read to understand current state shape and Stripe wiring before rewriting)
- `@src/app/create-perfume/success/page.tsx` (the routing this task MUST preserve)
- `@src/app/api/create-perfume/payment/route.ts` (Stripe PaymentIntent contract — must not change)
- `@src/components/ui/Button.tsx`, `@src/components/ui/Tag.tsx`, `@src/components/ui/RadioGroup.tsx`, `@src/components/ui/Checkbox.tsx`, `@src/components/ui/Toast.tsx`, `@src/styles/tokens.css`

**Design:**
- **Register:** brand (4 of 5 new files — page.tsx, StepSelector, SummaryPanel, VolumeSelect — operate in the brand register as numbered editorial seduction surfaces. PaymentStep.tsx is a product-register surface within the same task; §10b rules apply uniformly across both.)
- **Tokens used:** `var(--bg)`, `var(--bg-alt)`, `var(--fg)`, `var(--fg-muted)`, `var(--accent)`, `var(--accent-deep)`, `var(--border)`, `var(--font-display-xl)`, `var(--font-h1)`, `var(--font-h3)`, `var(--font-body-lg)`, `var(--font-micro)`, `var(--space-4)`, `var(--space-8)`, `var(--space-12)`, `var(--space-16)`, `var(--duration-fast)`, `var(--duration-base)`, `var(--duration-slow)`, `var(--ease-out-quart)`, `var(--shadow-1)`
- **Container variant:** numbered editorial (`01 / 02 / 03 / 04 / 05`) — locked. ONE variant only.
- **Scope:** page + four sibling components + one hook
- **Motion patterns (≥ 3 required, deliver all three):**
  1. Numeric ticker on `SummaryPanel` price — animates from previous value to current value over `--duration-base` using `requestAnimationFrame`; respects `prefers-reduced-motion`
  2. Scroll-triggered fade-up on each step body (`opacity 0 → 1`, `translateY 16px → 0`) via `IntersectionObserver`, `--duration-base`, `--ease-out-quart`, one-shot per element
  3. Type micro-shift on step-nav anchor underlines (`--duration-fast`) on hover/focus
- **Voice strings (locked, use VERBATIM, no em-dashes):**
  - Page eyebrow: `Three layers, four hours, one perfume.`
  - Step 01 title / description: `01 / Top notes` / `The first thing anyone smells. Pick two or three.`
  - Step 02 title / description: `02 / Heart notes` / `What stays after the top fades. Pick three to five.`
  - Step 03 title / description: `03 / Base notes` / `The wood and the resin. Pick two.`
  - Step 04 title / description: `04 / How much` / `Fifty millilitres for daily, one hundred for the shelf.`
  - Step 05 title: `05 / Read it back`
  - Review CTA: `Continue to payment`
  - SummaryPanel headline: `Your composition`
  - SummaryPanel price label: `Total`
  - Payment error toast: `We couldn't reach the desk. Try again.`
- **Anti-pattern guard:** builder runs `bash scripts/design-laws-check.sh src/app/create-perfume/` pre-commit; commit blocked on critical findings.

---

## Task 2 — Extend `/api/ai-assistant` for cart context + SSE streaming

**Wave:** 1
**Persona:** backend
**Files:**
- `src/app/api/ai-assistant/route.ts` — EXTEND. Accepts `{ messages: Message[], cartContext?: { cartSummary: { name: string; quantity: number; price_cents: number }[] } }` (Zod-validated). System prompt extended with: (a) voice-rule blurb (3 sentences: editorial, restrained, sensual; ban em-dashes, ban exclamation, ban emoji), (b) current cart summary serialized into the prompt as a paragraph ("The shopper currently has X, Y, and Z in their cart."), (c) instruction to end every reply with at least one product pick formatted as `[Product Name](/products/{slug})`. Response is `text/event-stream` (Server-Sent Events): chunks framed as `data: {"token": "..."}\n\n`, terminated by `data: [DONE]\n\n`. Rate-limited via existing Upstash `rate-limit.ts`. Falls back to a single-JSON-body response only if streaming integration is blocked by an upstream OpenRouter limitation discovered during the task (document the fallback with a TODO and an env flag `AI_STREAMING_ENABLED`).

**Depends on:** none (does not touch Task 1's files)

**Why:** The current `/api/ai-assistant/route.ts` returns a single JSON body — the AI-01 requirement that the concierge "feels like a concierge, not a chatbot" depends on token streaming for the perceived liveness of conversation; without streaming, the drawer would block on full-response generation and Khaled (niche connoisseur persona) would feel he's using a search box, not talking to a perfumer. Cart context (locked shape: `cartSummary: { name; quantity; price_cents }[]`) is what makes the AI feel aware of the shopper's state — without it, the model can't reference what's in the bag. The voice-rule blurb in the system prompt is what enforces no-em-dashes inside the model's own output (DESIGN.md §10b applies to AI-generated copy too).

**Acceptance Criteria:**
- Sending `POST /api/ai-assistant` with `{ messages: [{role:'user', content:'I like woody scents'}], cartContext: { cartSummary: [] } }` returns `Content-Type: text/event-stream` and streams tokens framed as `data: {"token":"..."}\n\n` ending with `data: [DONE]\n\n`.
- The completed assistant reply (concatenated tokens) contains at least one Markdown link in the form `[Some Real Product Name](/products/some-real-slug)` where the slug comes from `src/lib/ai/catalogue-data.ts` (not invented).
- When `cartContext.cartSummary` is non-empty, the assistant reply references at least one cart item by name in the conversation (e.g. "Since you already have X, I'd reach for Y").
- The assistant reply contains zero em-dashes (`—` or `–`) and zero emoji (verified by piping the streamed concatenation through the grep checks below).
- Rate-limiting via Upstash still applies (when configured): 5th request within 60s from the same IP returns 429.
- `src/lib/ai/catalogue-data.ts` is unchanged after this task (`git diff HEAD~1 src/lib/ai/catalogue-data.ts | wc -l` → 0).

**Action:**
1. Read the current `src/app/api/ai-assistant/route.ts` to understand the existing request shape, Zod schema, OpenRouter call, model selection (default `google/gemini-2.0-flash-001`), and rate-limiter integration.
2. Extend the Zod request schema: add an optional `cartContext` field with shape `z.object({ cartSummary: z.array(z.object({ name: z.string(), quantity: z.number().int().nonnegative(), price_cents: z.number().int().nonnegative() })).max(50) }).optional()`.
3. Build the system prompt in three layered sections (cache-stable prefix first, dynamic last):
   - **Persona block** (stable): 2-3 sentence editorial concierge persona. Approx: "You are a perfumer at the Aquad'or desk. You write in restrained, editorial, sensual prose. You do not use em-dashes, hyphens as punctuation, exclamation marks, or emoji. You address the shopper directly and you always end with one or two named picks linked in Markdown as `[Name](/products/slug)`. You source picks only from the catalogue provided below."
   - **Catalogue block** (stable, large): paste the full string export from `src/lib/ai/catalogue-data.ts` (already serialized at build time). DO NOT mutate the file — import the string and inline it.
   - **Cart block** (dynamic): if `cartContext?.cartSummary` is non-empty, append "The shopper currently has in their cart: " followed by a comma-separated rendering of `cartSummary.map(item => \`${item.quantity} × ${item.name} (€${(item.price_cents/100).toFixed(2)})\`)`. Periods and commas only. If empty, omit this block.
4. Replace the OpenRouter call with the streaming variant. Use `fetch` to OpenRouter's `/api/v1/chat/completions` endpoint with `stream: true`. Wrap the response body in a `ReadableStream` that transforms OpenRouter's SSE frames into Aquad'or's frame shape `data: {"token":"..."}\n\n`. Forward the upstream `[DONE]` terminator as `data: [DONE]\n\n`. Set response headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache, no-transform`, `Connection: keep-alive`, `X-Accel-Buffering: no`.
5. If during implementation the OpenRouter streaming endpoint returns an unexpected shape or the Vercel runtime rejects the stream framing, fall back to non-streaming: set an `AI_STREAMING_ENABLED` env flag (default `true`) and conditionally return a single JSON body when false. Log the fallback path with `console.warn` so verifier sees the decision. Document the fallback in a top-of-file comment.
6. Verify rate-limiting still wraps the new streaming path: invoke `rateLimit(req)` before the OpenRouter call; on limit-hit return `new Response('Too Many Requests', { status: 429 })` and DO NOT initiate the stream.
7. Run the existing webhook test suite to confirm no collateral damage (the AI route is not under that suite but cross-suite import paths can break compilation).

**Validation:**
- `grep -c 'text/event-stream\|ReadableStream' src/app/api/ai-assistant/route.ts` → ≥ 1
- `grep -c 'cartContext\|cartSummary' src/app/api/ai-assistant/route.ts` → ≥ 1
- `grep -rEn ' — | – ' src/app/api/ai-assistant/route.ts` → 0
- `grep -P '[\x{1F300}-\x{1F9FF}]|[\x{2600}-\x{27BF}]' src/app/api/ai-assistant/route.ts` → 0
- `git diff HEAD~1 -- src/lib/ai/catalogue-data.ts | wc -l` → 0
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → 0
- Manual smoke: `curl -N -X POST http://localhost:3000/api/ai-assistant -H 'Content-Type: application/json' -d '{"messages":[{"role":"user","content":"I like woody scents"}]}' | head -20` → emits `data: {"token":"..."}` frames
- `npm test src/app/api/webhooks/stripe 2>&1 | tail -3` → "Tests: 21 passed" or higher (non-regression)

**Context:** Read
- `@.planning/PRODUCT.md` (brand voice for system-prompt persona)
- `@.planning/DESIGN.md` §10b copy rules (which apply to AI output)
- `@src/app/api/ai-assistant/route.ts` (current implementation, Zod schema, rate-limit wiring)
- `@src/lib/ai/catalogue-data.ts` (READ-ONLY — import the serialized catalogue string)
- `@src/lib/rate-limit.ts` (Upstash wrapper to preserve)
- `@src/lib/api-utils.ts` (request-ID logging convention)

(No `Design:` block — backend route only, no .tsx/.css.)

---

## Task 3 — Build `AiConciergeDrawer` with streaming consumption, sessionStorage thread, cart serialization, keyboard nav

**Wave:** 2
**Persona:** frontend
**Files:**
- `src/components/ai/AiConciergeDrawer.tsx` — NEW. Default export `AiConciergeDrawer`. Renders an `@/components/ui/Drawer` from the right edge (max-width 28rem per DESIGN.md §5). Internal state: `messages: Message[]`, `input: string`, `isStreaming: boolean`, `error: string | null`. On mount, hydrates `messages` from `sessionStorage` key `aquador_concierge_thread` (Zod-validated; falls back to greeting on parse failure). On `messages` change, persists back to sessionStorage. The cart is read via `useCart()` from `@/components/cart/CartProvider` and serialized into `cartSummary` before every API call. Submitting the input POSTs `{ messages, cartContext: { cartSummary } }` to `/api/ai-assistant`, consumes the SSE stream via `fetch` + `ReadableStreamDefaultReader`, appends tokens to the in-progress assistant message in state as they arrive. Layout: hairline-divider stack — each conversation turn separated by `border-t border-border`, role label in the left margin (`font-micro uppercase text-fg-muted`: "You" / "Desk"), message body in the prose column. NO message bubbles. NO `<Card>` wrappers. Keyboard: input is the initial focused element on open (via Drawer's `initialFocus` prop); Tab moves through input → submit; Escape closes the drawer; on close, focus returns to the trigger element (handled by Drawer primitive). Submit button has `aria-label="Send message"`. On error: render a `Toast` with the voice-locked error string.
- `src/components/storefront/AiConciergeEntry.tsx` — MODIFY (Phase 2.1 shipped the trigger button; this task wires the full drawer content into it). Replace the placeholder drawer content with `<AiConciergeDrawer />`. Pass through the `isOpen` + `onClose` props.

**Depends on:** Task 2 (consumes the new SSE response shape and `cartContext` request shape)

**Why:** AI-01 says the concierge "feels like a concierge". That feeling comes from (a) streaming tokens (the visible thought-in-progress), (b) the editorial inline-thread layout (not chat bubbles), (c) thread persistence across pages (locked decision: sessionStorage, same-tab only), (d) cart-awareness in the reply. AI-03 mandates keyboard navigability and accessibility. The drawer is the single conversion surface that distinguishes Aquad'or from "another perfume shop with a chatbot widget" — Khaled (niche connoisseur) opens it BECAUSE it doesn't look like a chatbot. Wiring it into `AiConciergeEntry` (Phase 2.1's button) is what makes the homepage, PDP, shop, and builder all share the same persistent thread.

**Acceptance Criteria:**
- Clicking the AI concierge trigger on the homepage opens the drawer with the locked greeting message `"Three perfumers handle this desk. Tell us a scent you keep coming back to, or a moment you want to bottle."` as the first turn (only on initial open per session; subsequent opens restore the existing thread).
- Typing "I like woody scents" and pressing Enter (or clicking the Send button) streams the assistant reply token-by-token into the drawer; tokens fade in via `--duration-fast` opacity transition; the reply ends with at least one Markdown link to a real PDP slug (e.g. `[Lattafa Khamrah](/products/lattafa-khamrah)`) rendered as a clickable anchor.
- Adding a product to cart from the homepage, then opening the concierge and asking "What pairs with what I have?", produces a reply that references the in-cart item by name (proves `cartSummary` is being serialized and the API is reading it).
- Closing the drawer (Escape, scrim click, or close button), navigating to a PDP, and reopening the concierge from the PDP shows the same conversation thread (proves sessionStorage persistence + cross-page state).
- Closing the tab and reopening the site shows a fresh thread with the greeting (proves sessionStorage clears on tab close, not localStorage).
- Tab cycles through input → submit button (and only those — Drawer primitive's focus-trap handles bounds); Escape closes; focus returns to the trigger element after close (`document.activeElement` equals the trigger).
- Zero em-dashes, zero emoji, zero `<Card>` wrappers in the drawer body.

**Action:**
1. Read `src/components/storefront/AiConciergeEntry.tsx` (Phase 2.1 output) to understand the trigger + open/close prop shape. Read `src/components/cart/CartProvider.tsx` to understand the `useCart()` shape — confirm the items array carries name + quantity + price (in cents or major units; adapt as needed).
2. Create `src/components/ai/AiConciergeDrawer.tsx`. Define `type Message = { id: string; role: 'user' | 'assistant'; content: string; timestamp: number }`. Define a Zod schema for the persisted thread (`z.array(messageSchema)`).
3. On mount: read `sessionStorage.getItem('aquador_concierge_thread')`. If parseable and Zod-valid, hydrate `messages` state. Else seed with one assistant message containing the locked greeting.
4. On `messages` change (via `useEffect`): `sessionStorage.setItem('aquador_concierge_thread', JSON.stringify(messages))`. Wrap in try/catch — sessionStorage can throw in private-browsing modes; degrade gracefully (in-memory only).
5. Render layout: Drawer header = `<h2 className="font-display text-h2">Concierge</h2>` (no em-dashes); body = hairline-divider stack of turns; footer = a sticky `<Input>` + `<Button aria-label="Send message">` row with the placeholder `Type to begin.`. Each turn block: micro-label role tag in the left margin column, message body in the prose column, `border-t border-border` between turns.
6. Submit handler: append a new user message; create a placeholder assistant message with empty content; mark `isStreaming = true`; POST to `/api/ai-assistant` with `{ messages, cartContext: { cartSummary: cart.items.map(i => ({ name: i.name, quantity: i.quantity, price_cents: i.price_cents })) } }`. Read the response body as a `ReadableStream`; for each SSE frame, parse the JSON, append the `token` to the placeholder assistant message via a functional `setMessages` update; when `[DONE]` arrives, set `isStreaming = false`. Each newly-arrived token wraps in a `<span>` that fades in via CSS `animation: fade-in var(--duration-fast) var(--ease-out-quart) both` (the `streaming-token reveal` motion pattern). On fetch error: set `error` and show the toast `We couldn't reach the desk. Try again.`
7. Render Markdown links inside assistant message content. Use a minimal regex-based renderer (`/\[([^\]]+)\]\(([^)]+)\)/g`) that splits the string and emits `<a href={url} className="underline-anchor text-accent-deep">` for each link match. NO heavyweight markdown library — the assistant is constrained to plain prose + links by the system prompt.
8. Keyboard nav: pass `initialFocus={inputRef}` to the Drawer primitive so opening focuses the input. Drawer primitive already handles Escape + scrim + focus-return — verify by reading `src/components/ui/Drawer.tsx`.
9. Modify `src/components/storefront/AiConciergeEntry.tsx`: import `AiConciergeDrawer`; render `<AiConciergeDrawer isOpen={isOpen} onClose={onClose} />` in place of whatever placeholder content the Phase 2.1 entry had. Preserve the trigger button surface — Task 3 only wires the drawer body content.

**Validation:**
- `test -f src/components/ai/AiConciergeDrawer.tsx && echo EXISTS` → `EXISTS`
- `grep -c 'cartContext\|cartSummary' src/components/ai/AiConciergeDrawer.tsx` → ≥ 1
- `grep -c 'sessionStorage' src/components/ai/AiConciergeDrawer.tsx` → ≥ 2 (read + write)
- `grep -c 'ReadableStream\|getReader\|text/event-stream' src/components/ai/AiConciergeDrawer.tsx` → ≥ 1
- `grep -c 'aria-label="Send message"' src/components/ai/AiConciergeDrawer.tsx` → 1
- `grep -c 'AiConciergeDrawer' src/components/storefront/AiConciergeEntry.tsx` → ≥ 1
- `grep -rEn ' — | – ' src/components/ai/` → 0
- `grep -cE '<Card[ >]' src/components/ai/AiConciergeDrawer.tsx` → 0
- `grep -cE 'animate-|transition-|@keyframes' src/components/ai/` → ≥ 1
- `grep -P '[\x{1F300}-\x{1F9FF}]|[\x{2600}-\x{27BF}]' src/components/ai/` → 0
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → 0

**Context:** Read
- `@.planning/PRODUCT.md` (brand voice for greeting + microcopy)
- `@.planning/DESIGN.md` §5 (Drawer primitive contract — max-width 28rem, scrim, focus-trap), §7 (motion), §10b (zero `<Card>`, zero em-dash, mandatory motion)
- `@src/components/ui/Drawer.tsx` (Drawer primitive — focus-trap + initialFocus + scrim behaviors)
- `@src/components/ui/Input.tsx`, `@src/components/ui/Button.tsx`, `@src/components/ui/Toast.tsx`
- `@src/components/cart/CartProvider.tsx` (useCart hook shape — confirm item fields)
- `@src/components/storefront/AiConciergeEntry.tsx` (Phase 2.1 trigger — DO NOT rewrite the button surface; wire the drawer body into it)
- `@src/app/api/ai-assistant/route.ts` (the SSE response shape from Task 2)

**Design:**
- **Register:** brand (concierge is a seduction surface, full brand register)
- **Tokens used:** `var(--bg)`, `var(--bg-alt)`, `var(--fg)`, `var(--fg-muted)`, `var(--accent)`, `var(--accent-deep)`, `var(--border)`, `var(--font-display-xl)`, `var(--font-h2)`, `var(--font-body)`, `var(--font-micro)`, `var(--space-2)`, `var(--space-4)`, `var(--space-6)`, `var(--space-8)`, `var(--duration-fast)`, `var(--duration-base)`, `var(--ease-out-quart)`, `var(--shadow-3)` (Drawer overlay)
- **Container variant:** hairline-divider inline thread (one of the approved §10b patterns). NOT chat bubbles. NOT cards.
- **Scope:** component (drawer body) + one one-line edit to entry-point wiring
- **Motion patterns (≥ 1 within this file, contributes to phase total ≥ 3):**
  1. Streaming token reveal — each arriving token fades in via `animation: fade-in var(--duration-fast)` (the locked streaming-token-reveal pattern from §10b)
- **Voice strings (locked, use VERBATIM):**
  - Greeting (first message on first open): `Three perfumers handle this desk. Tell us a scent you keep coming back to, or a moment you want to bottle.`
  - Input placeholder: `Type to begin.`
  - Submit button aria-label: `Send message`
  - Drawer header: `Concierge`
  - Error toast: `We couldn't reach the desk. Try again.`
- **Anti-pattern guard:** builder runs `bash scripts/design-laws-check.sh src/components/ai/` pre-commit; commit blocked on critical findings.

---

## Task 4 — E2E Playwright spec: full builder flow + concierge product-link reply

**Wave:** 3
**Persona:** none
**Files:**
- `e2e/builder-and-concierge.spec.ts` — NEW. Two test cases:
  1. **Builder flow with Stripe test card lands on success page.** `page.goto('/create-perfume')`. Step through note selection: pick 2 top notes (`Bergamot`, `Pink Pepper`), 3 heart notes (`Rose`, `Jasmine`, `Iris`), 2 base notes (`Oud`, `Sandalwood`) via the StepSelector chips. Select 100ml volume. Advance to PaymentStep. Fill the Stripe Payment Element iframe with test card `4242 4242 4242 4242`, expiry `12/30`, CVC `123`, postal `12345`. Click "Continue to payment". Assert URL matches `/create-perfume/success?payment_intent=.*&payment_intent_client_secret=.*` within 30s. Assert page contains the success copy (read from current success page).
  2. **Concierge replies with a named-product link to a PDP.** `page.goto('/')`. Click the concierge entry button (`[data-testid="concierge-trigger"]` or by role). Wait for the drawer to be visible. Type `I like woody scents` into the message input. Press Enter. Wait up to 15s for the assistant reply to finish streaming (poll until `[data-streaming="false"]` or the input is re-enabled). Assert the reply contains at least one anchor `<a href="/products/...">` whose href starts with `/products/`. Click that anchor and assert the resulting URL matches `/products/.+` and the PDP page renders an `<h1>`.

**Depends on:** Task 1 (builder must exist for test 1), Task 3 (drawer must exist for test 2)

**Why:** Success criterion 4 in `<phase_details>` requires the test-card flow to land on the success page; criterion 5 requires the concierge to reply with a named product linked to its PDP. Both are behavioral and cannot be verified by grep alone — Playwright is the only deterministic way to confirm them end-to-end before declaring the phase done. Without this test, regressions in either flow ship silently to production.

**Acceptance Criteria:**
- `npm run test:e2e -- builder-and-concierge.spec.ts` exits 0 on chromium.
- Test 1 (builder) reaches `/create-perfume/success?payment_intent=...` within 30s of clicking pay.
- Test 2 (concierge) finds a PDP link in the streamed reply and navigates to it successfully.
- Test runs against the `npm run dev` server that Playwright auto-starts (`playwright.config.ts` already wires this).
- No flakiness: both tests pass on three consecutive local runs.

**Action:**
1. Read `playwright.config.ts` and an existing `e2e/*.spec.ts` (e.g. `e2e/cart.spec.ts` per CLAUDE.md) to confirm conventions: `test.describe`, `page.goto`, base URL, Stripe iframe selectors.
2. Write `e2e/builder-and-concierge.spec.ts` with two `test()` blocks inside one `test.describe('Phase 2.5 — Builder + AI Concierge')`.
3. For the Stripe test, use Playwright's iframe-locator pattern: `const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]')` then `stripeFrame.locator('[name="cardnumber"]').fill('4242424242424242')` etc. Stripe's test mode redirects to `return_url` synchronously when no 3DS is required for this card.
4. For the concierge test, use `page.waitForResponse(r => r.url().includes('/api/ai-assistant'))` to await stream initiation, then poll the DOM for the streamed reply text. Allow `timeout: 15_000` for the full stream to complete. Assert anchor presence via `page.locator('[data-testid="concierge-drawer"] a[href^="/products/"]').first()`.
5. Run the spec locally: `npx playwright test builder-and-concierge.spec.ts --project=chromium`. Iterate on selectors and timeouts until green three times in a row.
6. Add `data-testid="concierge-trigger"` to the `AiConciergeEntry` button and `data-testid="concierge-drawer"` to the `AiConciergeDrawer` root if not already present (one-line edits to enable stable selectors).

**Validation:**
- `test -f e2e/builder-and-concierge.spec.ts && echo EXISTS` → `EXISTS`
- `npx playwright test builder-and-concierge.spec.ts --project=chromium --reporter=line 2>&1 | tail -10` → `2 passed`
- `grep -c '4242 4242 4242 4242\|4242424242424242' e2e/builder-and-concierge.spec.ts` → ≥ 1
- `grep -c 'payment_intent_client_secret\|/create-perfume/success' e2e/builder-and-concierge.spec.ts` → ≥ 1
- `grep -c 'a\\[href.*/products/' e2e/builder-and-concierge.spec.ts` → ≥ 1
- `npm test src/app/api/webhooks/stripe 2>&1 | tail -3` → `Tests: 21 passed` or higher (non-regression after all three prior tasks)

**Context:** Read
- `@playwright.config.ts`
- `@e2e/cart.spec.ts` (example for Stripe iframe + selector convention)
- `@src/app/create-perfume/success/page.tsx` (the URL shape the test asserts)
- `@src/app/api/create-perfume/payment/route.ts` (to understand the PaymentIntent flow being tested)
- Outputs of Task 1 (`src/app/create-perfume/page.tsx` + children — for step-selector test selectors)
- Outputs of Task 3 (`src/components/ai/AiConciergeDrawer.tsx` — for concierge test selectors)

(No `Design:` block — E2E test only, no .tsx/.css.)

---

## Success Criteria

- [ ] `src/app/create-perfume/` contains ≥ 3 separate files and no file exceeds 300 LOC; `page.tsx` ≤ 150 LOC. (CREATE-01)
- [ ] The three-step composition UI uses `RadioGroup` / `Checkbox` / `Tag` primitives; `fragranceDatabase` and `validateComposition` are imported unchanged from `src/lib/perfume/`. (CREATE-02)
- [ ] The persistent `SummaryPanel` updates price immediately on every note + volume change; at step 03 the shopper sees their current top/heart notes plus the running total without scrolling. (CREATE-03)
- [ ] A Stripe test-card flow (`4242 4242 4242 4242`) completes via `/api/create-perfume/payment` and lands on `/create-perfume/success` with the existing PaymentIntent detection still working; the 21-test webhook suite exits 0. (CREATE-04)
- [ ] Opening the AI concierge from the homepage, PDP, or shop retains the conversation thread across navigations within the same tab; the model's response to "I like woody scents" includes at least one named product linked to its PDP. (AI-01, AI-02, AI-03)
- [ ] The concierge drawer is keyboard-navigable: Tab cycles through input + submit, Escape closes, focus returns to the trigger element on close. (AI-03)
- [ ] `src/lib/perfume/` and `src/lib/ai/catalogue-data.ts` show zero diff after the phase — they are READ-ONLY.
- [ ] Voice rules from DESIGN.md §10b hold across all new/modified files: zero em-dashes, zero hyphens-as-punctuation, zero emoji, voice consistent with PRODUCT.md across builder and concierge.
- [ ] `<Card>` is NOT used as a section wrapper on the builder page or in the concierge drawer (≤ 2 occurrences total across the touched files, reserved for interior callouts only).
- [ ] At least three approved motion patterns ship across the builder + concierge surfaces.

---

## Verification Contract

### Contract for Task 1 — file presence
**Check type:** file-exists
**Command:** `for f in src/app/create-perfume/page.tsx src/app/create-perfume/_hooks/useBuilderState.ts src/app/create-perfume/StepSelector.tsx src/app/create-perfume/SummaryPanel.tsx src/app/create-perfume/VolumeSelect.tsx src/app/create-perfume/PaymentStep.tsx; do test -f "$f" && echo "EXISTS: $f" || echo "MISSING: $f"; done`
**Expected:** Six `EXISTS:` lines, zero `MISSING:` lines
**Fail if:** Any file missing

### Contract for Task 1 — child components wired into page.tsx (Rule 6 wiring)
**Check type:** grep-match
**Command:** `grep -cE 'StepSelector|SummaryPanel|VolumeSelect|PaymentStep' src/app/create-perfume/page.tsx`
**Expected:** ≥ 4
**Fail if:** Returns < 4 — one or more step components exist but are not imported in the thin step-router. Catches "code exists but unwired".

### Contract for Task 1 — page.tsx LOC budget
**Check type:** command-exit
**Command:** `awk 'END { exit ($1 > 150) }' <(wc -l < src/app/create-perfume/page.tsx)`
**Expected:** Exit 0 (file ≤ 150 lines)
**Fail if:** Exit 1 — page.tsx exceeds 150 LOC

### Contract for Task 1 — every create-perfume file ≤ 300 LOC
**Check type:** command-exit
**Command:** `find src/app/create-perfume -name "*.tsx" -not -path "*/success/*" -exec wc -l {} \; | awk '{ if ($1 > 300) { print "OVER: " $0; over=1 } } END { exit over }'`
**Expected:** Exit 0, no `OVER:` lines
**Fail if:** Any file exceeds 300 LOC

### Contract for Task 1 — useBuilderState consumes domain library
**Check type:** grep-match
**Command:** `grep -cE 'fragranceDatabase|validateComposition|calculatePrice' src/app/create-perfume/_hooks/useBuilderState.ts`
**Expected:** ≥ 3
**Fail if:** Returns 0–2 — hook is not pulling from the read-only domain library

### Contract for Task 1 — perfume domain library UNCHANGED
**Check type:** command-exit
**Command:** `git diff HEAD~4 HEAD -- src/lib/perfume/ | wc -l | awk '{ exit ($1 != 0) }'`
**Expected:** Exit 0 (zero diff)
**Fail if:** Exit 1 — domain library was modified, violates READ-ONLY lock

### Contract for Task 1 — AI catalogue UNCHANGED
**Check type:** command-exit
**Command:** `git diff HEAD~4 HEAD -- src/lib/ai/catalogue-data.ts | wc -l | awk '{ exit ($1 != 0) }'`
**Expected:** Exit 0 (zero diff)
**Fail if:** Exit 1 — catalogue was modified, violates READ-ONLY lock

### Contract for Task 1 — success page routing PRESERVED
**Check type:** command-exit
**Command:** `git diff HEAD~4 HEAD -- src/app/create-perfume/success/page.tsx | wc -l | awk '{ exit ($1 != 0) }'`
**Expected:** Exit 0 (zero diff in the success page detection logic)
**Fail if:** Exit 1 — success page was modified, breaks payment return URL contract

### Contract for Task 1 — voice rules (no em-dashes in builder)
**Check type:** command-exit
**Command:** `grep -rEn ' — | – ' src/app/create-perfume/ | wc -l | awk '{ exit ($1 != 0) }'`
**Expected:** Exit 0 (zero matches)
**Fail if:** Exit 1 — em-dash or en-dash found in customer copy

### Contract for Task 1 — Card not used as section wrapper
**Check type:** command-exit
**Command:** `grep -cE '<Card[ >]' src/app/create-perfume/page.tsx src/app/create-perfume/StepSelector.tsx src/app/create-perfume/SummaryPanel.tsx src/app/create-perfume/VolumeSelect.tsx src/app/create-perfume/PaymentStep.tsx | awk -F: '{ sum += $2 } END { exit (sum > 2) }'`
**Expected:** Exit 0 (total ≤ 2 across all five files)
**Fail if:** Exit 1 — Card used as section wrapper

### Contract for Task 1 — motion present
**Check type:** command-exit
**Command:** `grep -rcE 'animate-|transition-|@keyframes|IntersectionObserver' src/app/create-perfume/ | awk -F: '{ sum += $2 } END { exit (sum < 3) }'`
**Expected:** Exit 0 (≥ 3 motion references)
**Fail if:** Exit 1 — fewer than three motion patterns

### Contract for Task 1 — zero emoji
**Check type:** command-exit
**Command:** `grep -P '[\x{1F300}-\x{1F9FF}]|[\x{2600}-\x{27BF}]' -r src/app/create-perfume/ | wc -l | awk '{ exit ($1 != 0) }'`
**Expected:** Exit 0 (zero matches)
**Fail if:** Exit 1 — emoji present

### Contract for Task 1 — locked voice strings present
**Check type:** grep-match
**Command:** `grep -rc 'Three layers, four hours, one perfume\|01 / Top notes\|Your composition\|Continue to payment' src/app/create-perfume/ | awk -F: '{ sum += $2 } END { exit (sum < 4) }'`
**Expected:** Exit 0 (≥ 4 locked-voice strings found across builder files)
**Fail if:** Exit 1 — voice samples not used verbatim

### Contract for Task 2 — route accepts cart context
**Check type:** grep-match
**Command:** `grep -cE 'cartContext|cartSummary' src/app/api/ai-assistant/route.ts`
**Expected:** ≥ 1
**Fail if:** Returns 0 — cart context not wired into the API

### Contract for Task 2 — streaming response (or documented fallback)
**Check type:** grep-match
**Command:** `grep -cE 'text/event-stream|ReadableStream' src/app/api/ai-assistant/route.ts`
**Expected:** ≥ 1
**Fail if:** Returns 0 — neither streaming nor an explicit fallback flag is wired

### Contract for Task 2 — AI route voice rules
**Check type:** command-exit
**Command:** `grep -rEn ' — | – ' src/app/api/ai-assistant/route.ts | wc -l | awk '{ exit ($1 != 0) }'`
**Expected:** Exit 0 (zero matches in the system prompt or any string literal)
**Fail if:** Exit 1 — em-dash present in the AI route source

### Contract for Task 2 — webhook suite non-regression
**Check type:** command-exit
**Command:** `npm test -- src/app/api/webhooks/stripe 2>&1 | tail -3`
**Expected:** Output contains `Tests: 21 passed` (or higher)
**Fail if:** Any webhook test fails or test count drops below 21

### Contract for Task 3 — AiConciergeDrawer exists and is wired
**Check type:** file-exists
**Command:** `test -f src/components/ai/AiConciergeDrawer.tsx && grep -c 'AiConciergeDrawer' src/components/storefront/AiConciergeEntry.tsx`
**Expected:** ≥ 1 (Phase 2.1's entry point imports the new drawer)
**Fail if:** File missing OR entry-point not wired

### Contract for Task 3 — cart serialization
**Check type:** grep-match
**Command:** `grep -cE 'cartContext|cartSummary' src/components/ai/AiConciergeDrawer.tsx`
**Expected:** ≥ 1
**Fail if:** Returns 0 — drawer doesn't serialize cart into API requests

### Contract for Task 3 — sessionStorage thread persistence
**Check type:** grep-match
**Command:** `grep -c 'sessionStorage' src/components/ai/AiConciergeDrawer.tsx`
**Expected:** ≥ 2 (one read, one write)
**Fail if:** Returns 0–1 — thread persistence missing

### Contract for Task 3 — streaming consumption
**Check type:** grep-match
**Command:** `grep -cE 'ReadableStream|getReader|text/event-stream' src/components/ai/AiConciergeDrawer.tsx`
**Expected:** ≥ 1
**Fail if:** Returns 0 — drawer reads response as a full body, not a stream

### Contract for Task 3 — keyboard accessibility
**Check type:** grep-match
**Command:** `grep -c 'aria-label="Send message"' src/components/ai/AiConciergeDrawer.tsx`
**Expected:** 1
**Fail if:** Returns 0 — submit button is unlabelled for assistive tech

### Contract for Task 3 — voice rules (no em-dashes, no Card, no emoji)
**Check type:** command-exit
**Command:** `grep -rEn ' — | – ' src/components/ai/ | wc -l | awk '{ exit ($1 != 0) }' && grep -cE '<Card[ >]' src/components/ai/AiConciergeDrawer.tsx | awk '{ exit ($1 != 0) }' && grep -P '[\x{1F300}-\x{1F9FF}]|[\x{2600}-\x{27BF}]' -r src/components/ai/ | wc -l | awk '{ exit ($1 != 0) }'`
**Expected:** Exit 0 (all three checks pass)
**Fail if:** Any of: em-dash present, Card used, emoji present

### Contract for Task 3 — motion present in concierge
**Check type:** command-exit
**Command:** `grep -rcE 'animate-|transition-|@keyframes|IntersectionObserver' src/components/ai/ | awk -F: '{ sum += $2 } END { exit (sum < 1) }'`
**Expected:** Exit 0 (≥ 1 motion reference — the streaming-token reveal)
**Fail if:** Exit 1 — no motion in the concierge

### Contract for Task 3 — locked voice strings present
**Check type:** grep-match
**Command:** `grep -c 'Three perfumers handle this desk\|Type to begin\|We couldn'\''t reach the desk' src/components/ai/AiConciergeDrawer.tsx`
**Expected:** ≥ 2
**Fail if:** Returns 0–1 — locked voice samples missing

### Contract for Task 4 — Playwright spec exists
**Check type:** file-exists
**Command:** `test -f e2e/builder-and-concierge.spec.ts && echo EXISTS`
**Expected:** `EXISTS`
**Fail if:** Spec missing

### Contract for Task 4 — Stripe test card asserted
**Check type:** grep-match
**Command:** `grep -cE '4242 ?4242 ?4242 ?4242|payment_intent_client_secret|/create-perfume/success' e2e/builder-and-concierge.spec.ts`
**Expected:** ≥ 2
**Fail if:** Returns 0–1 — test doesn't actually exercise the Stripe + success-page flow

### Contract for Task 4 — concierge PDP-link assertion
**Check type:** grep-match
**Command:** `grep -cE 'a\\[href.*products|href=.*/products/' e2e/builder-and-concierge.spec.ts`
**Expected:** ≥ 1
**Fail if:** Returns 0 — test doesn't assert the concierge surfaces a PDP link

### Contract for Task 4 — Playwright spec passes
**Check type:** command-exit
**Command:** `npx playwright test builder-and-concierge.spec.ts --project=chromium --reporter=line 2>&1 | tail -5`
**Expected:** Output contains `2 passed`
**Fail if:** Any test fails or fewer than 2 tests run

### Contract — phase-wide TypeScript health
**Check type:** command-exit
**Command:** `npx tsc --noEmit 2>&1 | grep -c "error TS"`
**Expected:** `0`
**Fail if:** Any TS error introduced by the phase

### Contract — phase-wide motion budget (≥ 3 patterns total)
**Check type:** command-exit
**Command:** `grep -rcE 'animate-|transition-|@keyframes|IntersectionObserver' src/app/create-perfume/ src/components/ai/ | awk -F: '{ sum += $2 } END { exit (sum < 3) }'`
**Expected:** Exit 0 (combined motion references ≥ 3)
**Fail if:** Exit 1 — phase did not deliver the three required motion patterns

### Contract — phase-wide voice + layout health
**Check type:** command-exit
**Command:** `grep -rEn ' — | – ' src/app/create-perfume/ src/components/ai/ | wc -l | awk '{ exit ($1 != 0) }'`
**Expected:** Exit 0 (zero em-dash/en-dash matches across both surfaces)
**Fail if:** Exit 1 — voice rule violated somewhere in the phase output

### Contract — phase-wide Card budget (≤ 2 total in builder + drawer)
**Check type:** command-exit
**Command:** `grep -crE '<Card[ >]' src/app/create-perfume/ src/components/ai/AiConciergeDrawer.tsx | awk -F: '{ sum += $2 } END { exit (sum > 2) }'`
**Expected:** Exit 0 (total ≤ 2)
**Fail if:** Exit 1 — Card used as section wrapper too often

### Contract — behavioral: AI reply references cart item by name
**Check type:** behavioral
**Command:** (manual verifier flow) Add a real catalogue product to cart from homepage. Open concierge. Send `What pairs with what I have?`. Read the streamed reply.
**Expected:** Reply contains the in-cart product's exact name as a substring (proves `cartSummary` round-trip)
**Fail if:** Reply ignores cart contents entirely

### Contract — behavioral: concierge thread persists across navigation
**Check type:** behavioral
**Command:** (manual verifier flow) Open concierge from homepage, send a message. Navigate to a PDP. Reopen concierge from the PDP.
**Expected:** The earlier user + assistant turns are still visible in the drawer; greeting is not re-shown
**Fail if:** Drawer reseeds to the greeting on the PDP — sessionStorage persistence broken

---

## Decision Coverage Audit

| Locked decision | Covered by | Where |
|---|---|---|
| Extract `useBuilderState` BEFORE splitting render | Task 1 | Action steps 1–2 |
| AI streaming via SSE; fallback non-streaming flag if slip | Task 2 | Action steps 4–5 |
| Cart context shape `cartSummary: { name; quantity; price_cents }[]` | Task 2 + Task 3 | T2 Action step 2 (Zod schema); T3 Action step 6 (serialization) |
| `create-perfume/success/` routing preserved verbatim | Task 1 | Action step 6 + Validation diff check |
| `src/lib/perfume/` + `src/lib/ai/catalogue-data.ts` READ-ONLY | Task 1 + Task 2 | T1 Validation `git diff` check; T2 Action step 3 (import-only) |
| sessionStorage thread persistence (cleared on tab close) | Task 3 | Action steps 3–4 |
| 4 tasks, 3 waves: T1+T2 wave 1, T3 wave 2 (depends T2), T4 wave 3 (depends T1+T3) | Wave assignment | Per-task `Wave` + `Depends on` headers |
| Card BANNED as section wrapper; numbered editorial on builder; hairline-divider inline thread in concierge | Task 1 + Task 3 | Both `Design:` blocks specify the container variant |
| AI system prompt enforces voice rules | Task 2 | Action step 3 (Persona block) |

No `Deferred Ideas` row appears in any task. All locked decisions covered.

---

## Wave Graph (deterministic, per planner role file)

| Task | Writes | Reads (Context + Depends on) | Edges | Wave |
|---|---|---|---|---|
| T1 — Rebuild builder | `src/app/create-perfume/page.tsx`, `_hooks/useBuilderState.ts`, `StepSelector.tsx`, `SummaryPanel.tsx`, `VolumeSelect.tsx`, `PaymentStep.tsx` | `@.planning/*`, `@src/lib/perfume/*` (read-only), `@src/app/api/create-perfume/payment/route.ts`, `@src/components/ui/*` | none | 1 |
| T2 — Extend AI route | `src/app/api/ai-assistant/route.ts` | `@.planning/*`, `@src/lib/ai/catalogue-data.ts` (read-only), `@src/lib/rate-limit.ts` | none | 1 |
| T3 — Build concierge drawer | `src/components/ai/AiConciergeDrawer.tsx`, `src/components/storefront/AiConciergeEntry.tsx` (one-line wiring edit) | `@src/app/api/ai-assistant/route.ts` (reads T2's output shape), `@src/components/cart/CartProvider.tsx`, `@src/components/ui/Drawer.tsx` | T2 → T3 | 2 |
| T4 — Playwright spec | `e2e/builder-and-concierge.spec.ts` | T1's builder files, T3's drawer file | T1 → T4, T3 → T4 | 3 |

**Parallel-safety check:** T1 and T2 write disjoint file sets (no overlap) → safe in Wave 1. T3 alone in Wave 2. T4 alone in Wave 3. No wave has two tasks writing the same file.

---

*Phase 5 plan ready for builder execution. Per role file rule: each task fits in one builder context window; no task touches more than 6 files; all four tasks honor every locked decision; every Verification Contract command is copy-pasteable.*
