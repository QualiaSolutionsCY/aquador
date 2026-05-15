## Browser QA

**Dev server:** http://localhost:3000
**Routes tested:** /, /shop, /design-system
**Phase:** 1 (M2 Phase 2.1 Homepage)
**Tested:** 2026-05-15

---

### Responsive

| Route | 375px | 768px | 1440px | Notes |
|-------|-------|-------|--------|-------|
| / | PASS | FAIL | FAIL | BrandStory bleed overflow at md+ viewports |
| /shop | PASS | -- | -- | Smoke check only, HTTP 200 |
| /design-system | PASS | -- | -- | HTTP 200 |

**Overflow detail:**

viewport=768 — route=/ — scrollWidth=800, clientWidth=768 — overflow +32px
viewport=1440 — route=/ — scrollWidth=1472, clientWidth=1440 — overflow +32px

Offending element: `DIV.aspect-[4/5].bg-bg-alt.md:mr-[calc(-1*var(--page-px))]` — right=800 at 768px viewport
Source: `src/components/storefront/BrandStory.tsx:45` — `className="aspect-[4/5] bg-bg-alt md:mr-[calc(-1*var(--page-px))]"`
Root cause: negative margin bleed pulls image div past viewport edge. `--page-px = clamp(1rem, 4vw, 4rem)` resolves to ~30.72px at 768px; element extends to 800px. Section lacks overflow-x hidden containment so bleed becomes actual horizontal scroll.

---

### Console Errors

route=/ — all viewports:

1. viewport=375 — route=/ — "eval() is not supported in this environment. [...] React requires eval() in development mode..." — React dev-mode only, not a production issue.

2. viewport=375 — route=/ — "Loading the script 'https://va.vercel-scripts.com/v1/script.debug.js' violates the following Content Security Policy directive: \"script-src 'self' 'unsafe-inline' https://vercel.live...\"" — Vercel Analytics debug script blocked by CSP. Dev-only variant. Pre-existing, not Phase 2.1 work.

3. viewport=375 — route=/ — "Loading the script 'https://va.vercel-scripts.com/v1/speed-insights/script.debug.js' violates the following Content Security Policy directive: ..." — Speed Insights debug script, same pattern.

4. viewport=375 — route=/ — "Failed to load resource: the server responded with a status of 500 (Internal Server Error)" x13 — All are GET /_next/image?url=https%3A%2F%2Fhznpuxplqgszbacxzbhv.supabase.co%2Fstorage%2Fv1%2Fobject%2Fpublic%2Fproducts%2F{name}.png
   Dev server log confirms: "Error [TimeoutError]: The operation was aborted due to timeout" at 7.0-7.2s per image. Direct curl of same Supabase URL returns HTTP 200. Local dev network latency causes Next.js image optimization pipeline to time out. Pre-existing infrastructure issue, not Phase 2.1 regression.

5. viewport=375 — route=/ — server log: "Heartbeat error: Error: Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL" — POST /api/heartbeat → 500 — Missing local env vars. Pre-existing.

Errors attributable to Phase 2.1 new code: 0

---

### Primary Flows

| Flow | Result | Notes |
|------|--------|-------|
| Hero h1 renders at 375px, correct copy | PASS | h1="Three hundred grams of paper, eight notes per perfume, one letter that knows scent." confirmed via page.evaluate |
| Hero in first viewport at 375px | PASS | min-h-[80vh] section with eyebrow, h1, body copy, CTA all in first paint. Hero not behind scroll. |
| Featured grid: 6 products rendered | PASS | 6 product h3 headings in DOM: Washwasha, Mayar Cherry Intense, Ra'ed Luxe, Ameer Al Arab, Asad, Eclaire Pistache |
| Email capture: submits without navigation | PASS | URL unchanged after form submit (http://localhost:3000/ before and after, 2s wait). preventDefault working. |
| Ask the desk: drawer opens | PASS (MEDIUM caveat) | data-state="open" on [role=dialog] confirmed. Drawer title "The desk is open." visible at 1440px. Caveat: at 375px, Playwright pointer events blocked by fixed header (<header class="fixed left-0 right-0 z-50 top-0 pt-1">) overlapping button click target when scrolled to page bottom. |

---

### Accessibility

- Images without alt: **0** (PASS)
- Inputs without labels (no aria-label / aria-labelledby / for= match): **0** (PASS)
- H1 count: **1** (PASS)
- Heading order: h1(Hero) > h2(FeaturedGrid) > h3 x6(ProductCards) > h2(NotesStory) > h2(BrandStory) > h2(JournalTeaser) > h3 x3(Footer nav) > h3(cookie consent) — no level skips, PASS
- Em-dashes in visible text: **0** (PASS)

---

### Copy / Design Constraints

| Check | Result | Evidence |
|-------|--------|---------|
| No emoji in rendered storefront sections | PASS | Playwright text walker found 0 emoji in visible DOM. Checkmark characters (U+2714) in raw HTML are inside <script>self.__next_f.push(...) RSC payload blobs (product description JSON data), not rendered in storefront components. |
| No em-dashes | PASS | document.body.innerText.includes(U+2014) = false at 375px via page.evaluate |
| Hero eyebrow copy | PASS | "Aquad'or, Cyprus." present in DOM above h1 |
| Hero CTA copy | PASS | "Read the collection" links to /shop |
| Sections use border-t hairline dividers | PASS | sectionBorderT map: [no(Hero), yes x6] confirmed via page.evaluate |
| No Card wrapper as section container | PASS | Grep: Card mentioned only in comments saying "NO Card wrapper"; ProductCard interior tile inside FeaturedGrid per spec allowance |
| Numbered eyebrows | PASS | In source: "01 / Notes", "02 / House", "03 / Letters", "04 / Featured" |

---

### Verdict

FAIL — 2 issues found.

**FAIL-1 (MEDIUM): Horizontal scroll at 768px and 1440px**
- Source: `src/components/storefront/BrandStory.tsx:45` — `md:mr-[calc(-1*var(--page-px))]` on `DIV.aspect-[4/5].bg-bg-alt`
- Measurement: scrollWidth=800, clientWidth=768 at 768px; scrollWidth=1472, clientWidth=1440 at 1440px
- Fix: Add `overflow-x: hidden` to the BrandStory section or parent, or use `position: absolute` approach for the bleed so it does not expand scroll width.

**FAIL-2 (MEDIUM): "Ask the desk" button inaccessible via pointer click at 375px**
- Evidence: Playwright log — "<header class=\"fixed left-0 right-0 z-50 top-0 pt-1\">...</header> subtree intercepts pointer events" when button scrolled into view at 375px.
- The button and drawer logic work (JS click succeeds, data-state="open" confirmed). The issue is fixed header z-50 overlapping the button bounding rect when page is scrolled to bottom on a 375px viewport.
- Fix: Increase bottom padding on AiConciergeEntry section so button does not coincide with area covered by sticky header on scroll, or lower the header z-index to not exceed the section scroll area.

**Pre-existing issues (not Phase 2.1 regressions, do not block Phase 2.1 sign-off):**
- /_next/image 500 timeouts — Supabase images, local dev network fetch timeout at 7s; Supabase storage directly accessible (HTTP 200)
- POST /api/heartbeat → 500 — Missing SUPABASE_SERVICE_ROLE_KEY in local env
- Vercel Analytics/Speed Insights CSP violations — dev-only script.debug.js variant, pre-existing
- quality="90" warning — src/components/ui/ProductImage.tsx:50 uses quality 90, pre-existing
