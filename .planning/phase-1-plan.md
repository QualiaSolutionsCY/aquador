---
phase: 1
milestone: 2
goal: "Replace the current homepage with a conversion-focused editorial page that states the value prop, surfaces featured products, introduces the AI concierge as a Drawer, and captures emails to Supabase — all under the editorial-luxury Levant-coded direction (DESIGN.md §10b)."
tasks: 4
waves: 3
---

# Phase 2.1: Homepage

**Goal:** A new `/` route ships an editorial-luxury homepage with: a full-bleed hero (value prop + CTA visible in first viewport at 375px and 1440px), a magazine-spread featured grid (6 products via existing `getFeaturedProducts(6)`), an AI concierge trigger that opens a `Drawer` surface (content placeholder until Phase 2.5), an inline email capture wired to a new `subscribers` Supabase table, and at least two editorial sections (notes story, brand story, journal teaser) with real Aquad'or voice copy. ONE container variant: hairline-divider stack with ONE full-bleed hero moment.

**Why this phase:** The current `src/app/page.tsx` still imports `@/components/home/*` (Hero/Categories/CreateSection/CTASection/FeaturedProducts), which were built against the old gold-on-black v1.2 design and the legacy product type. M2 cannot ship its storefront story without an editorial home page that demonstrates the §10b rules in practice (no `<Card>` section wrappers, no em-dashes, motion present, one container variant). This phase is also the first place the M1 primitives (`Drawer`, `Button`, `Input`, `Skeleton`, `Toast`) earn their keep on a customer page.

**Locked references (read before any task):**
- `@/home/qualia/Projects/aquador/.planning/PROJECT.md` — v3.0 substrate
- `@/home/qualia/Projects/aquador/.planning/PRODUCT.md` — voice (editorial · restrained · sensual)
- `@/home/qualia/Projects/aquador/.planning/DESIGN.md` — read §10b in full; it is commit-blocking
- `@/home/qualia/Projects/aquador/.planning/ROADMAP.md` — Phase 2.1 detail
- `@/home/qualia/Projects/aquador/.planning/REQUIREMENTS.md` — HOME-01..05, TRUST-01, TRUST-03

**Voice constants (ship these strings verbatim across the listed tasks):**
- Hero headline (≤ 18 words, no dashes): `Three hundred grams of paper, eight notes per perfume, one letter that knows scent.`
- Hero eyebrow: `Aquad'or, Cyprus.`
- Hero primary CTA label: `Read the collection`
- Hero primary CTA href: `/shop`
- Hero supporting line (fades up on scroll, ≤ 16 words, no dashes): `One hundred fragrances, three perfumers on the desk, and free shipping across Cyprus.`
- TRUST-01 microcopy (inline triplet beneath hero, comma-separated, no dashes): `Free shipping across Cyprus.` · `Thirty day returns.` · `Authenticity guaranteed.`
- AI concierge trigger label: `Ask the desk`
- AI concierge Drawer title: `The desk is open.`
- AI concierge Drawer placeholder body (until Phase 2.5 ships AI content): `Three perfumers handle this desk. They reply within a day. The conversation surface arrives shortly; until then, please write to hello@aquadorcy.com and we will reply by hand.`
- Email capture eyebrow: `Write us once. We will write back with three.`
- Email capture description: `One letter on Fridays. Three fragrances chosen, with a note on each.`
- Email capture input placeholder: `your.address@domain`
- Email capture submit button: `Subscribe`
- Email capture success Toast title: `Your address is filed.`
- Email capture success Toast description: `The first letter goes out on Friday.`
- Email capture duplicate Toast title: `You are already on the list.`
- Email capture duplicate Toast description: `The next letter still finds you.`
- Email capture error Toast title: `Something stalled.`
- Email capture error Toast description: `Try once more. If it persists, write to hello@aquadorcy.com.`
- Notes-story section eyebrow: `01 / Notes`
- Notes-story section title: `The pyramid, read top to base.`
- Notes-story body (≤ 80 words, no dashes): `A fragrance opens with citrus and aldehydes, then settles into heart florals and spice, and ends on woods, resins, and musk. The top is the first impression. The heart is the wear. The base is what the wool of a coat remembers a week later. Every page on the site reads in that order.`
- Brand-story section eyebrow: `02 / House`
- Brand-story section title: `Cyprus by way of Levantine paperwork.`
- Brand-story body (≤ 80 words, no dashes): `Aquad'or operates out of Nicosia. The catalogue draws from Lattafa and Al-Haramain houses for oud and amber, from Victoria's Secret originals for the clean musks, and from a small bench of independent perfumers we trust. The shipment leaves Cyprus three days a week. The letter that comes with it is written by one of us.`
- Journal-teaser section eyebrow: `03 / Letters`
- Journal-teaser section title: `Recent letters from the desk.`
- Journal-teaser body (≤ 60 words, no dashes): `Three short essays on what we are wearing this week, why oud reads warmer in October, and how to choose a signature without trying every bottle in the city. New letters publish on Fridays.`
- Journal-teaser CTA: `Read the journal` (href `/blog`)
- Featured-grid section eyebrow: `04 / Featured`
- Featured-grid section title: `Six the desk is wearing this week.`

These strings live in the components themselves. Do NOT externalize to JSON in this phase; copy lives next to JSX so a verifier grep can read it.

---

## Task 1 — Subscribers table migration

**Wave:** 1
**Persona:** backend
**Files:** `supabase/migrations/20260514120000_create_subscribers_table.sql` (new — creates `public.subscribers` table, RLS policy, indexes)
**Depends on:** none

**Why:** HOME-05 and TRUST-03 require a place to record email captures, and the locked decision rejected the Resend Audience API (paid feature, separate setup). Supabase is already the canonical data store for products / blog / admin_users, so subscribers belong there. The schema and RLS policy must exist before any API route can write to it; without this migration, Task 2 is unsigned cement.

**Acceptance Criteria:**
- A new migration file exists at `supabase/migrations/20260514120000_create_subscribers_table.sql`.
- The migration creates `public.subscribers` with columns: `id uuid primary key default gen_random_uuid()`, `email text not null unique`, `source text not null default 'homepage'`, `created_at timestamptz not null default now()`.
- RLS is enabled on the table; one policy allows `INSERT` for the `anon` role with no row check beyond the column constraints (this is intentional: email capture is a public action), and one policy allows `SELECT / UPDATE / DELETE` only to the `service_role` (admin readbacks happen via service-role context in M3).
- An index exists on `lower(email)` for case-insensitive duplicate detection.
- Running `npx supabase db push` (or applying the migration via the Supabase MCP migration tool) succeeds locally / on the linked project; verifier check `SELECT count(*) FROM subscribers` returns 0 with no permission error.

**Action:**
1. Create the migration SQL file at the path above. Use exactly this structure (timestamp is fixed so wave-graph is deterministic; if the chosen timestamp conflicts with a future migration, bump the seconds only):

```sql
-- Subscribers table for homepage email capture (Phase 2.1, HOME-05 / TRUST-03)
create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'homepage',
  created_at timestamptz not null default now()
);

create unique index if not exists subscribers_email_lower_idx
  on public.subscribers (lower(email));

alter table public.subscribers enable row level security;

-- Anyone (anon) can subscribe. This is a public action.
create policy "subscribers_insert_anon"
  on public.subscribers
  for insert
  to anon, authenticated
  with check (
    email is not null
    and char_length(email) between 5 and 254
    and position('@' in email) > 1
  );

-- Only the service role reads / updates / deletes. Admin readbacks happen in M3.
create policy "subscribers_service_role_full"
  on public.subscribers
  for all
  to service_role
  using (true)
  with check (true);

comment on table public.subscribers is
  'Email capture from storefront (homepage and future surfaces). Anon INSERT only; service role for everything else.';
```

2. Apply the migration: prefer `npx supabase db push` if the project is linked; otherwise run the SQL through the Supabase MCP `apply_migration` tool. Confirm the table appears in the linked project.
3. Regenerate types: `npx supabase gen types typescript --linked > src/lib/supabase/types.ts` is OUT OF SCOPE for this task (it would touch a file Task 2 reads in parallel); instead, Task 2 will declare a narrow inline type for `subscribers` rows and we will fold subscribers into the generated types in a separate cleanup task at the end of M2.

**Validation:** (builder self-check)
- `test -f supabase/migrations/20260514120000_create_subscribers_table.sql && echo OK` → `OK`
- `grep -c "create table if not exists public.subscribers" supabase/migrations/20260514120000_create_subscribers_table.sql` → `1`
- `grep -c "enable row level security" supabase/migrations/20260514120000_create_subscribers_table.sql` → `1`
- (If linked) `npx supabase db remote query "select count(*) from public.subscribers" 2>&1 | grep -E "^\s*0\s*$"` → at least one matching line (table exists, empty).

**Context:** Read `@/home/qualia/Projects/aquador/.planning/PROJECT.md`, `@/home/qualia/Projects/aquador/.planning/REQUIREMENTS.md` (HOME-05, TRUST-03), `@/home/qualia/Projects/aquador/CLAUDE.md` (Supabase Integration section), `@/home/qualia/Projects/aquador/supabase/migrations/20260302_enable_rls_all_tables.sql` (RLS pattern reference). Follow `~/.claude/rules/security.md` (RLS mandatory, service-role never client-side).

---

## Task 2 — Email-capture API route

**Wave:** 2
**Persona:** backend
**Files:** `src/app/api/email-capture/route.ts` (new — POST handler that Zod-validates body and inserts into `subscribers` via the cookie-free public Supabase client)
**Depends on:** Task 1

**Why:** The Phase 2.1 success criterion 4 ("email capture form submits without navigation; success Toast; email recorded") requires a server endpoint that the client can `fetch('/api/email-capture', { method: 'POST', body: JSON.stringify({ email }) })` against. The route must be its own file (not a shared `/api/contact` endpoint) because contact emails go through Resend and have different validation, rate-limiting, and side-effect shape; entangling them creates a swappable-vendor smell (`rules/architecture.md` §3).

**Acceptance Criteria:**
- `POST /api/email-capture` with `{ email: "valid@example.com" }` returns HTTP 200 and JSON `{ ok: true, status: "subscribed" | "already_subscribed" }`.
- `POST /api/email-capture` with an invalid email (`"not-an-email"`, empty string, missing field, > 254 chars) returns HTTP 400 and JSON `{ ok: false, error: "invalid_email" }`.
- A successful POST inserts (or upserts on the unique `lower(email)` index) one row into `public.subscribers` with `source = 'homepage'`. Duplicate POSTs do not throw; they return `status: "already_subscribed"`.
- The route runs on the Node runtime (the Supabase JS client uses Node primitives) and is dynamic (`export const dynamic = 'force-dynamic'`).
- The route does NOT import `@/lib/supabase/admin.ts` or any service-role client. The anon insert policy from Task 1 is sufficient.
- The route emits a `x-request-id` (the middleware already adds one for `/api/*` per `src/middleware.ts`; the route logs structured `{ requestId, route: 'email-capture', status }` via `src/lib/api-utils.ts` if available, else `console.log` with the same shape).

**Action:**
1. Create `src/app/api/email-capture/route.ts` exporting an async `POST(request: Request)` handler.
2. At the top of the file: `export const runtime = 'nodejs';` and `export const dynamic = 'force-dynamic';`.
3. Define the schema: `const Body = z.object({ email: z.string().trim().toLowerCase().email().max(254) });` using the existing `zod` dependency.
4. Parse `await request.json()`. On Zod failure: return `NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 })`.
5. Acquire a Supabase client via the existing cookie-free public reader `@/lib/supabase/public.ts` (export name: check the file; if it exports `createPublicClient` or `supabaseClient`, use that). The anon client is correct here because the RLS policy from Task 1 allows `INSERT` for `anon`.
6. Insert: `const { error } = await supabase.from('subscribers').insert({ email: parsed.data.email, source: 'homepage' });`.
7. Duplicate handling: PostgREST returns error code `23505` (unique violation) when the `subscribers_email_lower_idx` rejects a duplicate. Detect via `error?.code === '23505'` and return `{ ok: true, status: 'already_subscribed' }` with HTTP 200. Other errors return `{ ok: false, error: 'storage_failed' }` with HTTP 500 and are logged with the request id.
8. Success path: return `NextResponse.json({ ok: true, status: 'subscribed' })`.
9. Do NOT send a welcome email in this phase (no Resend integration here; the Toast in the client carries the welcome). A welcome-email side effect can attach in a later phase once we decide whether subscribers and contacts share Resend audiences.

**Validation:** (builder self-check)
- `test -f src/app/api/email-capture/route.ts && echo OK` → `OK`
- `grep -cE "supabaseClient|createPublicClient" src/app/api/email-capture/route.ts` → `≥ 1` (Supabase wired via the public adapter, not raw SDK; satisfies the verifier contract)
- `grep -cE "service_role|SUPABASE_SERVICE_ROLE_KEY|admin\\.ts" src/app/api/email-capture/route.ts` → `0` (no service-role exposure)
- `grep -cE "z\\.object|email\\(\\)" src/app/api/email-capture/route.ts` → `≥ 2` (Zod validation present)
- `npx tsc --noEmit 2>&1 | grep -c "src/app/api/email-capture"` → `0`
- Manual: with the dev server running, `curl -X POST http://localhost:3000/api/email-capture -H 'content-type: application/json' -d '{"email":"test+phase21@example.com"}'` returns `{"ok":true,"status":"subscribed"}`; the same call a second time returns `{"ok":true,"status":"already_subscribed"}`; `curl ... -d '{"email":"nope"}'` returns HTTP 400 with `{"ok":false,"error":"invalid_email"}`.

**Context:** Read `@/home/qualia/Projects/aquador/src/lib/supabase/public.ts` (to confirm the exact export name and signature), `@/home/qualia/Projects/aquador/src/lib/api-utils.ts` (request-id logger pattern), `@/home/qualia/Projects/aquador/src/middleware.ts` (already adds x-request-id), `@/home/qualia/Projects/aquador/src/app/api/contact/route.ts` (reference shape for a Zod-validated POST handler), `@/home/qualia/Projects/aquador/.planning/REQUIREMENTS.md` (HOME-05). Apply `~/.claude/rules/security.md` (Zod, no service-role client-side, RLS).

---

## Task 3 — Hero plus editorial sections

**Wave:** 2
**Persona:** frontend
**Files:**
- `src/components/storefront/Hero.tsx` (new — full-bleed editorial hero with eyebrow, headline, supporting line, primary CTA, inline TRUST-01 triplet beneath; one IntersectionObserver scroll-reveal for the supporting line; underline-reveal type micro-shift on the CTA)
- `src/components/storefront/NotesStory.tsx` (new — numbered editorial section `01 / Notes`; type-led layout, no `<Card>` wrapper; fade-up on IntersectionObserver)
- `src/components/storefront/BrandStory.tsx` (new — magazine-spread section `02 / House`; `grid-cols-1 md:grid-cols-[40%_60%]`; type column left, single editorial image right that bleeds to viewport edge with `w-screen` on the right column via negative-margin or container break-out)
- `src/components/storefront/JournalTeaser.tsx` (new — numbered editorial section `03 / Letters`; type-led; CTA link to `/blog` with underline-reveal micro-shift)

**Depends on:** none (parallel-safe with Task 2: disjoint writes; this task does not consume the API route's contract — that's Task 4's EmailCapture component)

**Why:** HOME-01, HOME-02, and TRUST-01 require: a hero that states the value prop in the first viewport, two-to-three editorial sections with real copy, and shipping/returns/authenticity microcopy below the fold. These four components carry zero state and zero data fetching, so they belong together in one builder spawn — they share design language (numbered eyebrows, type-led structure, fade-up motion) and one builder reading the voice constants once can write all four consistently. They are the "editorial spine" that proves the §10b rules: no `<Card>` section wrappers, no em-dashes, motion present (≥ 2 of the ≥ 3 patterns this phase needs live in this task), one container variant (hairline-divider stack).

**Acceptance Criteria:**
- `Hero.tsx` is a Client Component (`'use client'`) and renders, in this order: a small `font-micro` eyebrow `Aquad'or, Cyprus.`, then a `font-display` `clamp()`-sized headline with the verbatim Voice constant headline, then a `font-body` supporting line wired to an IntersectionObserver that toggles a class for `opacity-0 translate-y-4` → `opacity-100 translate-y-0` with `transition-[opacity,transform] duration-[var(--duration-base)] ease-[var(--ease-out-quart)]`, then a primary `<Button asChild><Link href="/shop">Read the collection</Link></Button>` whose hover state reveals/extends a 2px underline using a `::after` pseudo-element or a Tailwind `after:` utility (`--duration-fast`), then the TRUST-01 triplet rendered as three `font-micro uppercase tracking-[0.05em]` spans separated by a thin border-vertical (no `·` middot character — use `<span class="border-l border-border-strong h-3"/>` separators or simply three `<li>` items in an inline `<ul>` with `gap-6`).
- The hero uses ONE full-bleed moment: `<section className="relative min-h-[80vh] md:min-h-[88vh] w-full ...">` with a tinted-neutral background (no image required for v3.0 launch; if an image is wanted the builder may stage a placeholder OptimizedImage from existing assets but no new asset commits are required by this task). At 375px the headline + CTA + microcopy all fit above the fold (`min-h-[80vh]` ensures the hero owns the first viewport; the headline uses `clamp(2.5rem, 5vw + 1rem, 5rem)` so it scales).
- `Hero.tsx` does NOT import `<Card>`, does NOT contain ` — ` or ` – ` (literal em-dash/en-dash with surrounding spaces) in any JSX text, and does NOT import from `@/components/home/*` (the old folder is being deprecated).
- `NotesStory.tsx` renders a `<section className="border-t border-border py-16 md:py-24 px-[var(--page-px)]">` (hairline-divider stack pattern, NOT a `<Card>`), with: `01 / Notes` eyebrow in `font-micro`, the section title in `font-display`, and the body paragraph in `font-body max-w-[var(--container-narrow)]`. An IntersectionObserver fade-up triggers on the title block (one-shot).
- `BrandStory.tsx` renders a `<section className="border-t border-border py-16 md:py-24">` containing `<div className="grid grid-cols-1 md:grid-cols-[40%_60%] gap-8 px-[var(--page-px)]">` (magazine-spread pattern). Left column: eyebrow + title + body. Right column: an `<OptimizedImage>` or a placeholder `<div className="aspect-[4/5] bg-bg-alt">` if no production image is yet selected — the layout must still bleed: at `md+` the right column gets `md:mr-[calc(-1*var(--page-px))]` so it touches the viewport edge.
- `JournalTeaser.tsx` renders a `<section className="border-t border-border py-16 md:py-24 px-[var(--page-px)]">` with the eyebrow / title / body / CTA. The CTA is `<Link href="/blog">` styled with the same underline-reveal pattern as the hero CTA, NOT a `<Button>` (links are inline in editorial text).
- All four components import their text content as in-file string literals using the exact Voice constants from the plan preamble. The verifier will grep for the literal headline.
- Each component file ends with a default export of the component and is named so `import Hero from '@/components/storefront/Hero'` works (default export, file name matches PascalCase).
- Each component is server-renderable where possible: `NotesStory.tsx`, `BrandStory.tsx`, `JournalTeaser.tsx` are RSC by default. `Hero.tsx` is `'use client'` because of IntersectionObserver. The fade-up in the three editorial sections can be done with a tiny shared client hook OR a single `'use client'` wrapper child component inside each otherwise-RSC section — builder picks one approach and uses it for all three (consistent rhythm per §10b rule 8).
- All four components render at 375px AND 1440px without horizontal overflow. The builder verifies by running `npm run dev` and checking both viewports manually before commit.
- All four components honor `prefers-reduced-motion: reduce` automatically because the IntersectionObserver class toggles into Tailwind utilities that read from `--duration-*` tokens, which `tokens.css` zeros under reduced-motion.

**Action:**
1. Create the `src/components/storefront/` directory (it does not exist yet).
2. Build `Hero.tsx` first. Structure:
   ```tsx
   'use client';
   import { useEffect, useRef, useState } from 'react';
   import Link from 'next/link';
   import { Button } from '@/components/ui';

   export default function Hero() {
     const ref = useRef<HTMLParagraphElement | null>(null);
     const [visible, setVisible] = useState(false);
     useEffect(() => {
       const el = ref.current; if (!el) return;
       const io = new IntersectionObserver(([entry]) => {
         if (entry.isIntersecting) { setVisible(true); io.disconnect(); }
       }, { threshold: 0.4 });
       io.observe(el);
       return () => io.disconnect();
     }, []);
     return (
       <section className="relative min-h-[80vh] md:min-h-[88vh] w-full flex items-end bg-bg-alt px-[var(--page-px)] py-[var(--page-py)]">
         <div className="max-w-[var(--container-prose)]">
           <p className="font-micro uppercase tracking-[0.08em] text-fg-muted text-[var(--font-micro)]">Aquad'or, Cyprus.</p>
           <h1 className="font-display text-[var(--font-display-3xl)] leading-[1.05] tracking-[-0.02em] text-fg mt-6">
             Three hundred grams of paper, eight notes per perfume, one letter that knows scent.
           </h1>
           <p
             ref={ref}
             className={`font-body text-[var(--font-body-lg)] text-fg-muted mt-6 max-w-[42rem] transition-[opacity,transform] duration-[var(--duration-base)] ease-[var(--ease-out-quart)] ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
           >
             One hundred fragrances, three perfumers on the desk, and free shipping across Cyprus.
           </p>
           <div className="mt-10">
             <Button asChild size="lg" className="group relative">
               <Link href="/shop">
                 <span className="relative after:absolute after:left-0 after:-bottom-1 after:h-px after:w-0 after:bg-current after:transition-[width] after:duration-[var(--duration-fast)] group-hover:after:w-full">
                   Read the collection
                 </span>
               </Link>
             </Button>
           </div>
           <ul className="mt-12 flex flex-wrap gap-x-6 gap-y-2 font-micro uppercase tracking-[0.05em] text-[var(--font-micro)] text-fg-muted">
             <li>Free shipping across Cyprus.</li>
             <li>Thirty day returns.</li>
             <li>Authenticity guaranteed.</li>
           </ul>
         </div>
       </section>
     );
   }
   ```
   (Adjust import path for `Button` if `@/components/ui` is a folder index re-export. Confirm against `src/components/ui/index.ts`.)
3. Build `NotesStory.tsx`, `BrandStory.tsx`, `JournalTeaser.tsx`. Share one tiny `'use client'` helper `src/components/storefront/FadeUp.tsx` if it keeps each section RSC; otherwise add `'use client'` to each. The helper signature:
   ```tsx
   // src/components/storefront/FadeUp.tsx
   'use client';
   import { useEffect, useRef, useState, type ReactNode } from 'react';
   export default function FadeUp({ children, className = '' }: { children: ReactNode; className?: string }) {
     const ref = useRef<HTMLDivElement | null>(null);
     const [v, setV] = useState(false);
     useEffect(() => {
       const el = ref.current; if (!el) return;
       const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); io.disconnect(); } }, { threshold: 0.25 });
       io.observe(el); return () => io.disconnect();
     }, []);
     return (
       <div
         ref={ref}
         className={`transition-[opacity,transform] duration-[var(--duration-base)] ease-[var(--ease-out-quart)] ${v ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} ${className}`}
       >{children}</div>
     );
   }
   ```
4. Use Voice constants VERBATIM. Do not paraphrase. Do not add em-dashes.
5. Run the design-laws grep locally before committing (see Validation).

**Validation:** (builder self-check)
- `test -f src/components/storefront/Hero.tsx && test -f src/components/storefront/NotesStory.tsx && test -f src/components/storefront/BrandStory.tsx && test -f src/components/storefront/JournalTeaser.tsx && echo OK` → `OK`
- `grep -cE "<Card[ >]" src/components/storefront/Hero.tsx src/components/storefront/NotesStory.tsx src/components/storefront/BrandStory.tsx src/components/storefront/JournalTeaser.tsx` → `0`
- `grep -rEn ' — | – ' src/components/storefront/Hero.tsx src/components/storefront/NotesStory.tsx src/components/storefront/BrandStory.tsx src/components/storefront/JournalTeaser.tsx` → no matches
- `grep -cE "IntersectionObserver|animate-|transition-" src/components/storefront/Hero.tsx src/components/storefront/FadeUp.tsx 2>/dev/null` → `≥ 2` (motion present)
- `grep -F "Three hundred grams of paper, eight notes per perfume, one letter that knows scent." src/components/storefront/Hero.tsx` → matches (headline verbatim)
- `grep -F "The pyramid, read top to base." src/components/storefront/NotesStory.tsx` → matches
- `grep -F "Cyprus by way of Levantine paperwork." src/components/storefront/BrandStory.tsx` → matches
- `grep -F "Recent letters from the desk." src/components/storefront/JournalTeaser.tsx` → matches
- `npx tsc --noEmit 2>&1 | grep -c "src/components/storefront"` → `0`
- Manual: `npm run dev`, open `/`, confirm Hero renders at first viewport on iPhone-13-mini emulation (375 × 812) AND on 1440 × 900. The Hero is not yet wired into the page in this task; the builder may stage a temporary `app/(dev)/preview-hero/page.tsx` import for visual QA OR simply wait for Task 4 to mount it.

**Context:** Read `@/home/qualia/Projects/aquador/.planning/DESIGN.md` (read §10b in full — it is commit-blocking; read §2 OKLCH tokens, §3 typography, §4 spacing, §7 motion), `@/home/qualia/Projects/aquador/.planning/PRODUCT.md` (voice register), `@/home/qualia/Projects/aquador/src/components/ui/index.ts` (confirm `Button` export path and `asChild` prop availability), `@/home/qualia/Projects/aquador/src/components/ui/Button.tsx` (props), `@/home/qualia/Projects/aquador/src/styles/tokens.css` (CSS variables — confirm `--font-display-3xl`, `--page-px`, `--page-py`, `--container-prose`, `--container-narrow`, `--duration-base`, `--ease-out-quart` are all defined; if any are missing, declare them inline via `style={{ ... }}` and surface a deviation note rather than guess names). Apply `~/.claude/rules/grounding.md` (no hedging in copy).

**Design:**
- Register: brand (PRODUCT.md says brand register dominates on the homepage; this is exactly that moment)
- Tokens used: `var(--font-display-3xl)`, `var(--font-body-lg)`, `var(--font-micro)`, `var(--page-px)`, `var(--page-py)`, `var(--container-prose)`, `var(--container-narrow)`, `var(--duration-base)`, `var(--duration-fast)`, `var(--ease-out-quart)`, semantic Tailwind `bg-bg-alt`, `text-fg`, `text-fg-muted`, `border-border`, `border-border-strong`
- Scope: section (4 components, all of them section-level for homepage)
- Container variant for this phase: hairline-divider stack with ONE full-bleed hero. Every component in this task must respect that variant: Hero is the full-bleed moment; NotesStory / BrandStory / JournalTeaser all use `<section className="border-t border-border ...">` and NEVER wrap their content in `<Card>` / `rounded-*` boxes.
- Motion patterns delivered by this task (counts toward the ≥ 3 phase requirement): (1) IntersectionObserver fade-up on Hero supporting line, (2) IntersectionObserver fade-up on the three editorial section titles via `FadeUp.tsx`, (3) underline-reveal hover micro-shift on Hero CTA and JournalTeaser CTA.
- Anti-pattern guard: before commit, run `node bin/slop-detect.mjs src/components/storefront/Hero.tsx src/components/storefront/BrandStory.tsx` if the script exists in this repo; if not (the file is referenced in `~/.claude/agents/planner.md` but may not be checked in yet), substitute the explicit grep commands listed in Validation. The verifier will run the §10b grep checks regardless.

---

## Task 4 — FeaturedGrid, EmailCapture, AiConciergeEntry, and page assembly

**Wave:** 3
**Persona:** frontend
**Files:**
- `src/components/storefront/FeaturedGrid.tsx` (new — magazine-spread layout consuming `getFeaturedProducts(6)` server-side via a thin RSC wrapper, then handing rendered items to a client child for hover crossfade; uses the existing `ProductCard` primitive from `@/components/ui/ProductCard`; uses `Skeleton` for streaming placeholder)
- `src/components/storefront/EmailCapture.tsx` (new — inline editorial form, `'use client'`, posts to `/api/email-capture`, uses `Input` + `Button` + `useToast` from `@/components/ui`)
- `src/components/storefront/AiConciergeEntry.tsx` (new — small inline trigger plus a `Drawer` surface that renders the Phase-2.5 placeholder body; `'use client'`)
- `src/app/page.tsx` (rewrite — replaces the current `@/components/home/*` imports with the new `@/components/storefront/*` set; assembles Hero → FeaturedGrid → NotesStory → BrandStory → JournalTeaser → EmailCapture; mounts AiConciergeEntry as a sibling so the Drawer renders at page root)

**Depends on:** Task 2 (EmailCapture POSTs to `/api/email-capture`), Task 3 (Hero / NotesStory / BrandStory / JournalTeaser must exist before page.tsx imports them)

**Why:** This task delivers the remaining three interactive pieces of the homepage AND wires the whole page together. HOME-03 requires a featured grid using `ProductCard`; HOME-04 requires an AI concierge trigger that opens a `Drawer` without looking like a chatbot widget; HOME-05 + TRUST-03 require an email-capture form that submits without navigation and shows a Toast on success. All three are `'use client'` because they own interactive state, and all three depend on the M1 primitives (`Drawer`, `Input`, `Button`, `Toast` via `useToast`, `Skeleton`, `ProductCard`). Wiring them in the same task as the page assembly keeps the integration in one builder's head: the builder reads `getFeaturedProducts`, sees that the page must stream from RSC, decides whether `FeaturedGrid` is a server component that renders `<ProductCard>` directly or a server-shell-with-client-hover-island, and ships a coherent answer. Splitting page assembly out would force the builder of `page.tsx` to relearn the component contracts. The AI concierge `Drawer` content is intentionally a placeholder string (locked decision): Phase 2.5 owns the AI integration; Phase 2.1 owns the surface.

**Acceptance Criteria:**
- `src/app/page.tsx` is an async RSC that calls `const featured = await getFeaturedProducts(6)` and renders, in document order: `<Hero />`, `<FeaturedGrid products={featured} />` (wrapped in `<Suspense fallback={<FeaturedGridSkeleton />}>` — the Skeleton fallback lives inside `FeaturedGrid.tsx` as a named export), `<NotesStory />`, `<BrandStory />`, `<JournalTeaser />`, `<EmailCapture />`, and `<AiConciergeEntry />`. The order matches the editorial rhythm; container variant is hairline-divider stack throughout (no `<Card>` wrappers anywhere in this page).
- `src/app/page.tsx` no longer imports anything from `@/components/home/*`. The old files in `src/components/home/` are LEFT IN PLACE (not deleted) so other routes that may still reference them do not break; cleanup of `components/home/` is out of scope for Phase 2.1 and will land in a later cleanup pass.
- The page exports the existing `metadata` and `revalidate = 600` (ISR) — preserve these from the current `src/app/page.tsx` so SEO does not regress.
- The page also preserves the existing `organizationSchema` JSON-LD `<script>` block (read the current file; the schema is referenced in the `head` via a `<script type="application/ld+json">` injection); if the existing implementation moves the schema into the body via a child component, keep it functionally equivalent.
- `FeaturedGrid.tsx` accepts `products: Product[]` (the canonical Supabase `Product` type from `src/lib/supabase/types.ts`). It renders a `<section className="border-t border-border py-16 md:py-24 px-[var(--page-px)]">` with the eyebrow `04 / Featured` and title `Six the desk is wearing this week.`, followed by a magazine-spread grid: at `md+` `grid-cols-12` with the first product spanning `col-span-7 row-span-2` (the "lead" product, image emphasized), and the remaining five in `col-span-5` / smaller `col-span-3` slots; at `<md` the grid collapses to single-column. Each item uses the existing `ProductCard` primitive (do NOT rebuild card markup; respect TYPE-02). The grid has at most ONE `<Card>` reference total (and that comes from `ProductCard` itself, which the §10b verifier explicitly allows: "Card sparingly used for highlighted content tiles, not section wrappers"). The section wrapper itself MUST NOT be a `<Card>`.
- Hover crossfade: each `ProductCard` in the grid receives a `secondaryImage` prop (if the product has a `gallery_image_urls[0]` second image; otherwise the prop is absent and no crossfade triggers — graceful degradation). Implementation: either `ProductCard` already supports this prop (check `src/components/ui/ProductCard.tsx`; if it does, pass it through), or `FeaturedGrid` wraps each `ProductCard` in a small `'use client'` `<HoverCrossfade>` child that absolutely-positions a second `<OptimizedImage>` over the card and toggles its `opacity-0 hover:opacity-100 transition-opacity duration-[var(--duration-base)]`. The wrapping approach is preferred because it does not modify the existing `ProductCard` API.
- `FeaturedGridSkeleton` (named export from `FeaturedGrid.tsx`) renders six `<Skeleton>` blocks in the same grid layout, so the Suspense fallback preserves layout (no CLS).
- `EmailCapture.tsx` is `'use client'`. It renders a `<section className="border-t border-border py-16 md:py-24 px-[var(--page-px)]">` with the eyebrow `Write us once. We will write back with three.`, the description paragraph, and an inline form: `<form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-[36rem]">` containing `<Input type="email" name="email" required placeholder="your.address@domain" aria-label="Email address" />` and `<Button type="submit" disabled={pending}>Subscribe</Button>`. The form does NOT wrap content in `<Card>`.
- On submit: `e.preventDefault()`, `setPending(true)`, `fetch('/api/email-capture', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email }) })`, parse JSON. On `{ ok: true, status: 'subscribed' }` show the success Toast with the locked title + description, clear the input. On `{ ok: true, status: 'already_subscribed' }` show the duplicate Toast and clear the input. On any other shape or thrown error show the error Toast. Always `setPending(false)` in `finally`. The form never navigates; the page does not reload.
- The Toast appears via `useToast` from `@/components/ui` (M1 substrate; the layout already mounts `<Toaster />` per the project context). The Toast respects the editorial voice (locked strings used verbatim).
- Email-capture inline microcopy beneath the form, in `font-micro uppercase tracking-[0.05em] text-fg-muted`: `One letter a week. Unsubscribe at the foot of any letter.` (no dashes, no emoji).
- `AiConciergeEntry.tsx` is `'use client'`. It exports default a component that renders BOTH: (a) a discreet inline trigger — `<button className="font-micro uppercase tracking-[0.08em] underline-offset-4 hover:underline ..." onClick={() => setOpen(true)}>Ask the desk</button>` (NOT a floating chat bubble; placed inline by the page within a `<section>` between BrandStory and JournalTeaser, OR more simply rendered at page root and floating *as a discreet anchored link in the footer-adjacent margin* — builder picks the inline-section approach: a `<section className="border-t border-border py-16 px-[var(--page-px)] text-center"><p className="font-body text-fg-muted">A perfumer reads your message and replies within a day.</p><button ...>Ask the desk</button></section>`), AND (b) the `<Drawer>` from `@/components/ui` controlled by `open` state.
- The Drawer's content is the locked placeholder: title `The desk is open.`, body the locked placeholder paragraph. The Drawer respects M1 focus trap and escape-to-close (already implemented in the primitive — do not re-implement). Focus returns to the trigger button on close.
- The Drawer is NOT a chatbot widget: no chat bubble icon, no floating action button at viewport bottom-right, no emoji, no `<MessageCircle />` icon as a FAB. The trigger is a `font-micro` linked label that reads as editorial chrome.
- `npm run build` exits 0; `npm run lint` exits 0; `npm run type-check` exits 0.
- Visual QA at 375 × 812 (iPhone 13 mini emulation) and 1440 × 900: the hero fits the first viewport with the CTA visible; the FeaturedGrid renders six products without overflow; the EmailCapture form is single-column on mobile and side-by-side on desktop; the AiConciergeEntry trigger is keyboard-reachable (Tab moves focus to it; Enter opens the Drawer; Escape closes it; focus returns).

**Action:**
1. Read `src/components/ui/ProductCard.tsx` to confirm its prop signature and whether it supports a `secondaryImage` / hover-crossfade prop. If yes, use it; if no, build a thin `<HoverCrossfade>` wrapper inside `FeaturedGrid.tsx` (one small `'use client'` sub-component in the same file).
2. Read `src/components/ui/Drawer.tsx` and `src/components/ui/Toast.tsx` (or wherever `useToast` is exported from) to confirm the controlled-open API and the `useToast` return shape (`toast({ title, description, variant? })`).
3. Build `FeaturedGrid.tsx` as a server component that takes `products` as a prop and renders the grid. The `Suspense` boundary lives in `page.tsx`, not inside `FeaturedGrid.tsx`. `FeaturedGrid.tsx` also exports a named `FeaturedGridSkeleton` for `page.tsx` to import as the `fallback`. If hover crossfade requires a client child, isolate it to one small client sub-component file co-located: `src/components/storefront/HoverCrossfade.tsx`.
4. Build `EmailCapture.tsx`. Use `useToast`. Use the locked Toast strings exactly. Use the locked microcopy. Validate the email client-side with a minimal regex before posting (saves a network round-trip on obvious typos; the server is still authoritative).
5. Build `AiConciergeEntry.tsx`. Default-export a component that renders the inline trigger section and the `<Drawer>` with the placeholder body. Title: `The desk is open.`. Body: the locked placeholder. No emoji. No chat bubble. The trigger is a labelled `<button>` — not an icon-only IconButton.
6. Rewrite `src/app/page.tsx`:
   ```tsx
   import { Suspense } from 'react';
   import type { Metadata } from 'next';
   import { getFeaturedProducts } from '@/lib/supabase/product-service';
   import Hero from '@/components/storefront/Hero';
   import FeaturedGrid, { FeaturedGridSkeleton } from '@/components/storefront/FeaturedGrid';
   import NotesStory from '@/components/storefront/NotesStory';
   import BrandStory from '@/components/storefront/BrandStory';
   import JournalTeaser from '@/components/storefront/JournalTeaser';
   import EmailCapture from '@/components/storefront/EmailCapture';
   import AiConciergeEntry from '@/components/storefront/AiConciergeEntry';

   export const revalidate = 600;
   export const metadata: Metadata = { /* preserve existing title/description/canonical */ };

   export default async function Home() {
     const products = await getFeaturedProducts(6);
     // Preserve the existing organizationSchema JSON-LD as-is (read the current file and copy it verbatim into a <script> element OR a child component).
     return (
       <>
         <Hero />
         <Suspense fallback={<FeaturedGridSkeleton />}>
           <FeaturedGrid products={products} />
         </Suspense>
         <NotesStory />
         <BrandStory />
         <JournalTeaser />
         <EmailCapture />
         <AiConciergeEntry />
       </>
     );
   }
   ```
7. Verify the page does NOT import `@/components/home/Hero`, `@/components/home/Categories`, `@/components/home/CreateSection`, `@/components/home/CTASection`, or `@/components/home/FeaturedProducts`. Those imports must be removed.
8. Run all three local quality gates (`npm run build`, `npm run lint`, `npm run type-check`) and the Phase 2.1 §10b greps before committing. If any grep returns a non-zero count where it should be zero, FIX the offending file before commit; do not commit and hope.

**Validation:** (builder self-check — run all of these before commit)
- `test -f src/components/storefront/FeaturedGrid.tsx && test -f src/components/storefront/EmailCapture.tsx && test -f src/components/storefront/AiConciergeEntry.tsx && echo OK` → `OK`
- `grep -cE "<Card[ >]" src/components/storefront/FeaturedGrid.tsx src/components/storefront/EmailCapture.tsx src/components/storefront/AiConciergeEntry.tsx src/app/page.tsx` → `0` (no Card section wrappers; the inner ProductCard usage in FeaturedGrid imports `ProductCard`, not `Card`, so this grep is clean)
- `grep -rEn ' — | – ' src/components/storefront/FeaturedGrid.tsx src/components/storefront/EmailCapture.tsx src/components/storefront/AiConciergeEntry.tsx src/app/page.tsx` → no matches
- `grep -P '[\x{1F300}-\x{1F9FF}]|[\x{2600}-\x{27BF}]' src/components/storefront/ src/app/page.tsx` → no matches (no emoji)
- `grep -cE "ProductCard" src/components/storefront/FeaturedGrid.tsx` → `≥ 1` (HOME-03 wired)
- `grep -cE "Drawer" src/components/storefront/AiConciergeEntry.tsx` → `≥ 1` (HOME-04 wired)
- `grep -cE "fetch\\('/api/email-capture'" src/components/storefront/EmailCapture.tsx` → `1` (HOME-05 wired to Task 2's route)
- `grep -cE "useToast|toast\\(" src/components/storefront/EmailCapture.tsx` → `≥ 1` (Toast on success)
- `grep -c "@/components/home/" src/app/page.tsx` → `0` (old imports removed)
- `grep -cE "Hero|FeaturedGrid|NotesStory|BrandStory|JournalTeaser|EmailCapture|AiConciergeEntry" src/app/page.tsx` → `≥ 7` (all seven components imported and rendered)
- `grep -cE "animate-|transition-|@keyframes|IntersectionObserver" src/components/storefront/Hero.tsx src/components/storefront/FeaturedGrid.tsx` → `≥ 3` across the two files (phase motion requirement; crossfade contributes from FeaturedGrid, fade-up + underline-reveal from Hero)
- `npm run build` → exits 0
- `npm run type-check` → exits 0
- `npm run lint` → exits 0
- Manual at `npm run dev`: open `http://localhost:3000`, verify (a) hero fits first viewport on 375 × 812 emulation, (b) featured grid renders 6 products, (c) clicking `Ask the desk` opens the Drawer with the placeholder body, (d) submitting the email form with a fresh address shows the success Toast and clears the input, (e) submitting the same address again shows the duplicate Toast, (f) submitting an obviously bad email shows the error Toast, (g) `prefers-reduced-motion: reduce` (DevTools rendering emulation) zeros the fade-ups and crossfade.

**Context:** Read `@/home/qualia/Projects/aquador/src/lib/supabase/product-service.ts` (the existing `getFeaturedProducts` signature, returns `Product[]`), `@/home/qualia/Projects/aquador/src/components/ui/ProductCard.tsx` (props + whether secondaryImage is supported), `@/home/qualia/Projects/aquador/src/components/ui/Drawer.tsx`, `@/home/qualia/Projects/aquador/src/components/ui/Toast.tsx`, `@/home/qualia/Projects/aquador/src/components/ui/index.ts`, `@/home/qualia/Projects/aquador/src/lib/supabase/types.ts` (canonical `Product`), `@/home/qualia/Projects/aquador/src/app/page.tsx` (current implementation — to preserve `metadata` and JSON-LD), `@/home/qualia/Projects/aquador/.planning/DESIGN.md` §10b (commit-blocking rules), `@/home/qualia/Projects/aquador/.planning/REQUIREMENTS.md` (HOME-01..05). Apply `~/.claude/rules/grounding.md` (no hedging), `~/.claude/rules/security.md` (Zod on the server, no service-role exposure — the email-capture route from Task 2 handles this).

**Design:**
- Register: brand (FeaturedGrid + EmailCapture + AiConciergeEntry + page.tsx all operate in the brand register; homepage is a "moment of seduction" per PRODUCT.md)
- Tokens used: `var(--page-px)`, `var(--page-py)`, `var(--container-prose)`, `var(--font-display-2xl)`, `var(--font-body-lg)`, `var(--font-micro)`, `var(--duration-base)`, `var(--duration-fast)`, `var(--ease-out-quart)`, semantic `bg-bg`, `bg-bg-alt`, `text-fg`, `text-fg-muted`, `border-border`, `border-border-strong`, `bg-accent` (Button hover), `--shadow-1` (Drawer surface, M1 primitive default), `--shadow-3` (Drawer overlay, M1 primitive default)
- Scope: section + page (4 files; one is the page composer)
- Container variant for this phase: hairline-divider stack with ONE full-bleed hero. Every section here uses `<section className="border-t border-border ...">`. The Drawer is an overlay primitive, exempt from the section pattern.
- Motion patterns delivered by this task: (4) image hover crossfade on product cards in FeaturedGrid (`--duration-base`), (5) Drawer enter/exit (already implemented by the M1 primitive — counts as a motion pattern by composition), (6) optional numeric ticker on FeaturedGrid eyebrow if the builder wants ("01 / 02 / 03" counts) — NOT required, only encouraged. With Task 3's three motion patterns plus crossfade and Drawer, the phase comfortably clears the ≥ 3 floor.
- Anti-pattern guard: before commit, run the §10b verifier greps in Validation. The verifier will run them again at phase end. If any returns non-zero where it should be zero, fix and re-commit (do NOT `--no-verify`).

---

## Success Criteria

These map 1:1 to the ROADMAP Phase 2.1 success criteria. All five must be true at phase end.

- [ ] **HOME-01:** A visitor landing on `/` sees the hero headline, the primary CTA (`Read the collection`), and the TRUST-01 microcopy in the first viewport on both 375 × 812 (iPhone 13 mini emulation) and 1440 × 900. No scrolling required. Verified by manual visual QA in Chrome DevTools device emulation.
- [ ] **HOME-02:** At least two of the three editorial sections (`NotesStory`, `BrandStory`, `JournalTeaser`) render with real Aquad'or voice copy. (All three ship in this plan; the success-criterion floor is two, this phase exceeds.) No lorem ipsum, no placeholder strings other than the explicitly-locked AI Drawer placeholder.
- [ ] **HOME-03:** The `FeaturedGrid` section renders six products consumed from `getFeaturedProducts(6)`, using the existing `@/components/ui/ProductCard` primitive. A `Skeleton` fallback covers the streaming window.
- [ ] **HOME-04:** Clicking the `Ask the desk` trigger opens a `Drawer` overlay; pressing Escape or clicking the scrim closes it; focus returns to the trigger; the Drawer does not look like a chatbot widget (it is an editorial inline link, not a floating bubble).
- [ ] **HOME-05 + TRUST-03:** Submitting the email capture form with a valid address records the email in `public.subscribers` (Task 1's table), shows the success Toast, and clears the input. Duplicate submissions show the duplicate Toast. Invalid emails show the error Toast. The page never navigates.
- [ ] **TRUST-01:** Shipping, returns, and authenticity microcopy appear inline beneath the hero CTA, in the first viewport.
- [ ] **§10b copy hygiene:** Zero em-dashes / en-dashes in customer-visible JSX strings across `src/components/storefront/*.tsx` and `src/app/page.tsx`. Zero emoji. Voice consistent across hero, sections, EmailCapture, AiConciergeEntry, and Toast strings.
- [ ] **§10b layout hygiene:** Zero `<Card>` section wrappers in the four new `src/components/storefront/*.tsx` files and `src/app/page.tsx`. (Inner usage of `ProductCard` inside `FeaturedGrid` is allowed and does not count as a `<Card>` reference.)
- [ ] **§10b motion hygiene:** ≥ 3 motion patterns present across the storefront components, drawn from the approved list (scroll-triggered fade-up, image hover crossfade, type micro-shift underline-reveal, Drawer enter/exit). `prefers-reduced-motion: reduce` zeros all of them.
- [ ] **One container variant per page:** the homepage is hairline-divider stack with one full-bleed hero. No magazine-spread / numbered-editorial / sidebar-margin patterns appear OUTSIDE the BrandStory magazine-spread moment (which is intentional and the only one).
- [ ] **Quality gates:** `npm run build` exits 0, `npm run type-check` exits 0, `npm run lint` exits 0.

---

## Decision Coverage Audit

Locked decisions from the orchestrator's preamble, mapped to tasks:

| Decision | Covered by |
|---|---|
| Email target is Supabase `subscribers` table (not Resend audience) | Task 1 (migration) + Task 2 (route writes via anon insert against the table) |
| Featured grid limit = 6 (existing `getFeaturedProducts(6)`) | Task 4 (page.tsx calls `getFeaturedProducts(6)` and passes the array to FeaturedGrid) |
| Hero copy committed in plan, NOT deferred | Voice constants block at top of plan; Task 3 acceptance criteria require verbatim use; verifier greps for the literal headline |
| AiConciergeDrawer CONTENT is Phase 2.5; Phase 2.1 ships the BUTTON + DRAWER SURFACE with placeholder body | Task 4 (AiConciergeEntry — locked placeholder strings, no AI integration, no streaming) |
| TrustBar standalone is Phase 2.2; TRUST-01 here = inline microcopy below hero | Task 3 (Hero embeds the trust triplet inline; no `<TrustBar>` import in Phase 2.1) |
| One container variant per page (hairline-divider stack + one full-bleed hero) | Task 3 + Task 4 (every section uses `border-t border-border ...`; only Hero is full-bleed; BrandStory uses magazine grid inside a hairline-divider section, which is grid-internal and consistent with the variant) |
| Motion mandatory: ≥ 3 patterns from the approved list | Task 3 ships fade-up + underline-reveal; Task 4 ships hover crossfade + Drawer enter/exit; total ≥ 4 patterns |

No deferred ideas appear in any task. All locked decisions are covered.

---

## Verification Contract

### Contract for Task 1 — Subscribers migration (file)
**Check type:** file-exists
**Command:** `test -f supabase/migrations/20260514120000_create_subscribers_table.sql && echo OK`
**Expected:** `OK`
**Fail if:** Migration file does not exist at that exact path.

### Contract for Task 1 — Subscribers migration (RLS enabled)
**Check type:** grep-match
**Command:** `grep -cE "enable row level security|alter table public.subscribers enable row level security" supabase/migrations/20260514120000_create_subscribers_table.sql`
**Expected:** `≥ 1`
**Fail if:** Returns 0 — RLS not enabled on the table (security regression).

### Contract for Task 1 — Subscribers migration (anon insert policy)
**Check type:** grep-match
**Command:** `grep -cE "subscribers_insert_anon|for insert.*to anon" supabase/migrations/20260514120000_create_subscribers_table.sql`
**Expected:** `≥ 1`
**Fail if:** Returns 0 — anon role cannot insert; email capture from the homepage would fail.

### Contract for Task 2 — Email-capture route (file + Supabase wired)
**Check type:** grep-match
**Command:** `grep -cE "supabaseClient|createPublicClient" src/app/api/email-capture/route.ts`
**Expected:** `≥ 1`
**Fail if:** Returns 0 — route does not import the Supabase public client (HOME-05 broken).

### Contract for Task 2 — Email-capture route (Zod validation present)
**Check type:** grep-match
**Command:** `grep -cE "z\\.object|\\.email\\(\\)" src/app/api/email-capture/route.ts`
**Expected:** `≥ 2`
**Fail if:** Returns less than 2 — no Zod schema or no email validation (security regression).

### Contract for Task 2 — Email-capture route (no service-role exposure)
**Check type:** grep-match
**Command:** `grep -cE "service_role|SUPABASE_SERVICE_ROLE_KEY|@/lib/supabase/admin" src/app/api/email-capture/route.ts`
**Expected:** `0`
**Fail if:** Non-zero — service-role client imported into a public route (CRITICAL security breach).

### Contract for Task 2 — Email-capture route (TypeScript clean)
**Check type:** command-exit
**Command:** `npx tsc --noEmit 2>&1 | grep -c "src/app/api/email-capture"`
**Expected:** `0`
**Fail if:** Any TS errors reported for the new route file.

### Contract for Task 2 — Email-capture route (behavioral)
**Check type:** behavioral
**Command:** With dev server running, `curl -s -X POST http://localhost:3000/api/email-capture -H 'content-type: application/json' -d '{"email":"verify+2-1@example.com"}'`
**Expected:** `{"ok":true,"status":"subscribed"}` on first call; `{"ok":true,"status":"already_subscribed"}` on second call; HTTP 400 with `{"ok":false,"error":"invalid_email"}` for `{"email":"x"}`.
**Fail if:** Any of the three responses deviates.

### Contract for Task 3 — Hero file exists
**Check type:** file-exists
**Command:** `test -f src/components/storefront/Hero.tsx && test -f src/components/storefront/NotesStory.tsx && test -f src/components/storefront/BrandStory.tsx && test -f src/components/storefront/JournalTeaser.tsx && echo OK`
**Expected:** `OK`
**Fail if:** Any of the four files missing.

### Contract for Task 3 — Hero ships locked headline verbatim
**Check type:** grep-match
**Command:** `grep -cF "Three hundred grams of paper, eight notes per perfume, one letter that knows scent." src/components/storefront/Hero.tsx`
**Expected:** `1`
**Fail if:** 0 — headline missing or paraphrased (locked-decision violation).

### Contract for Task 3 — Editorial section titles verbatim
**Check type:** grep-match
**Command:** `grep -cF "The pyramid, read top to base." src/components/storefront/NotesStory.tsx && grep -cF "Cyprus by way of Levantine paperwork." src/components/storefront/BrandStory.tsx && grep -cF "Recent letters from the desk." src/components/storefront/JournalTeaser.tsx`
**Expected:** `1` for each
**Fail if:** Any title is paraphrased or missing.

### Contract for Task 3 — No Card section wrappers in editorial sections
**Check type:** grep-match
**Command:** `grep -cE "<Card[ >]" src/components/storefront/Hero.tsx src/components/storefront/NotesStory.tsx src/components/storefront/BrandStory.tsx src/components/storefront/JournalTeaser.tsx`
**Expected:** `0`
**Fail if:** Non-zero — Card primitive used as section wrapper (§10b rule 5 violation).

### Contract for Task 3 — Motion present (≥ 2 patterns in this task)
**Check type:** grep-match
**Command:** `grep -cE "IntersectionObserver|transition-|animate-" src/components/storefront/Hero.tsx src/components/storefront/FadeUp.tsx src/components/storefront/NotesStory.tsx src/components/storefront/BrandStory.tsx src/components/storefront/JournalTeaser.tsx 2>/dev/null`
**Expected:** `≥ 2`
**Fail if:** Less than 2 — task did not contribute meaningfully to the phase's ≥ 3 motion-pattern floor.

### Contract for Task 4 — Storefront components present
**Check type:** file-exists
**Command:** `test -f src/components/storefront/FeaturedGrid.tsx && test -f src/components/storefront/EmailCapture.tsx && test -f src/components/storefront/AiConciergeEntry.tsx && echo OK`
**Expected:** `OK`
**Fail if:** Any of the three files missing.

### Contract for Task 4 — page.tsx imports the new storefront set
**Check type:** grep-match
**Command:** `grep -cE "@/components/storefront/(Hero|FeaturedGrid|NotesStory|BrandStory|JournalTeaser|EmailCapture|AiConciergeEntry)" src/app/page.tsx`
**Expected:** `≥ 7`
**Fail if:** Less than 7 — at least one storefront component is not imported (page assembly incomplete).

### Contract for Task 4 — page.tsx no longer imports legacy home folder
**Check type:** grep-match
**Command:** `grep -c "@/components/home/" src/app/page.tsx`
**Expected:** `0`
**Fail if:** Non-zero — old v1.2 components still in use; page rewrite incomplete.

### Contract for Task 4 — getFeaturedProducts wired
**Check type:** grep-match
**Command:** `grep -cE "getFeaturedProducts\\(6\\)" src/app/page.tsx`
**Expected:** `1`
**Fail if:** 0 — featured grid not consuming the canonical product service with the locked limit.

### Contract for Task 4 — EmailCapture posts to the route
**Check type:** grep-match
**Command:** `grep -cE "fetch\\('/api/email-capture'" src/components/storefront/EmailCapture.tsx`
**Expected:** `1`
**Fail if:** 0 — capture not wired to Task 2's route (HOME-05 broken).

### Contract for Task 4 — Toast used on submit
**Check type:** grep-match
**Command:** `grep -cE "useToast|toast\\(" src/components/storefront/EmailCapture.tsx`
**Expected:** `≥ 1`
**Fail if:** 0 — submit has no Toast feedback (HOME-05 success criterion broken).

### Contract for Task 4 — AiConciergeEntry uses Drawer
**Check type:** grep-match
**Command:** `grep -cE "Drawer" src/components/storefront/AiConciergeEntry.tsx`
**Expected:** `≥ 1`
**Fail if:** 0 — HOME-04 not satisfied.

### Contract for Task 4 — AiConciergeEntry is not a chatbot bubble
**Check type:** grep-match
**Command:** `grep -cE "MessageCircle|MessageSquare|ChatBubble|fixed bottom-|right-4 bottom-4" src/components/storefront/AiConciergeEntry.tsx`
**Expected:** `0`
**Fail if:** Non-zero — concierge rendered as floating chatbot bubble (HOME-04 acceptance criterion violation, PRODUCT.md anti-reference).

### Contract for Phase — No em-dash / en-dash in customer JSX
**Check type:** grep-match
**Command:** `grep -rEn ' — | – ' src/components/storefront/Hero.tsx src/components/storefront/FeaturedGrid.tsx src/components/storefront/EmailCapture.tsx src/components/storefront/AiConciergeEntry.tsx src/components/storefront/NotesStory.tsx src/components/storefront/BrandStory.tsx src/components/storefront/JournalTeaser.tsx src/app/page.tsx`
**Expected:** No matches (exit code 1, zero lines)
**Fail if:** Any match — §10b rule 1 violation (commit-blocking).

### Contract for Phase — No Card section wrappers anywhere on the homepage
**Check type:** grep-match
**Command:** `grep -cE "<Card[ >]" src/components/storefront/Hero.tsx src/components/storefront/FeaturedGrid.tsx src/components/storefront/EmailCapture.tsx src/components/storefront/AiConciergeEntry.tsx src/components/storefront/NotesStory.tsx src/components/storefront/BrandStory.tsx src/components/storefront/JournalTeaser.tsx src/app/page.tsx`
**Expected:** `0`
**Fail if:** Non-zero — §10b rule 5 violation. (Inner usage of `ProductCard` is a different identifier and will not match this grep.)

### Contract for Phase — Motion floor (≥ 3 patterns across Hero + FeaturedGrid)
**Check type:** grep-match
**Command:** `grep -cE "animate-|transition-|@keyframes|IntersectionObserver" src/components/storefront/Hero.tsx src/components/storefront/FeaturedGrid.tsx`
**Expected:** `≥ 3`
**Fail if:** Less than 3 — phase fails the §10b motion requirement.

### Contract for Phase — No emoji anywhere on the homepage surface
**Check type:** grep-match
**Command:** `grep -rP '[\x{1F300}-\x{1F9FF}]|[\x{2600}-\x{27BF}]' src/components/storefront/ src/app/page.tsx`
**Expected:** No matches
**Fail if:** Any match — §10b rule 4 violation (commit-blocking).

### Contract for Phase — Type-check clean
**Check type:** command-exit
**Command:** `npx tsc --noEmit 2>&1 | grep -cE "error TS"`
**Expected:** `0`
**Fail if:** Any TypeScript compilation errors.

### Contract for Phase — Lint clean
**Check type:** command-exit
**Command:** `npm run lint 2>&1 | grep -cE " error |✖ .* problems? \\([1-9]"`
**Expected:** `0`
**Fail if:** Any lint errors (warnings tolerated).

### Contract for Phase — Build succeeds
**Check type:** command-exit
**Command:** `npm run build`
**Expected:** Exit code 0
**Fail if:** Build fails for any reason.

### Contract for Phase — Hero + CTA visible in first viewport at 375px (behavioral)
**Check type:** behavioral
**Command:** Open `/` in Chrome DevTools at 375 × 812. Confirm the headline, primary CTA `Read the collection`, and the TRUST-01 microcopy triplet are all visible without scrolling.
**Expected:** All three visible above the fold.
**Fail if:** Any of the three requires scroll — HOME-01 fail.

### Contract for Phase — Hero + CTA visible in first viewport at 1440px (behavioral)
**Check type:** behavioral
**Command:** Open `/` at 1440 × 900. Confirm the headline + CTA + TRUST-01 microcopy are all visible without scrolling.
**Expected:** All visible above the fold.
**Fail if:** Any requires scroll — HOME-01 fail.

### Contract for Phase — Email capture round-trip works (behavioral)
**Check type:** behavioral
**Command:** Submit a new email via the form on `/`. Observe the success Toast. Refresh and submit the same email. Observe the duplicate Toast. Submit `not-an-email`. Observe the error Toast. Confirm the page never navigates and the URL never changes.
**Expected:** Three distinct Toasts as described; no navigation.
**Fail if:** Any of the three flows is broken or the page reloads — HOME-05 fail.

### Contract for Phase — Concierge Drawer opens, closes on Escape, focus returns (behavioral)
**Check type:** behavioral
**Command:** Tab to the `Ask the desk` trigger. Press Enter to open. Confirm the Drawer renders the locked placeholder body. Press Escape. Confirm the Drawer closes and focus returns to the trigger.
**Expected:** All four steps behave as described.
**Fail if:** Drawer does not open, scrim click does not close it, Escape does not close it, or focus does not return — HOME-04 fail.
