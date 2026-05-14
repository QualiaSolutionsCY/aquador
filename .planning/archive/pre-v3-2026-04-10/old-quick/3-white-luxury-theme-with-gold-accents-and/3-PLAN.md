---
phase: quick-3
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app/globals.css
  - tailwind.config.ts
  - src/components/layout/Navbar.tsx
  - src/components/layout/Footer.tsx
  - src/components/home/Hero.tsx
  - src/components/home/Categories.tsx
  - src/components/home/FeaturedProducts.tsx
  - src/components/home/CreateSection.tsx
  - src/components/home/CTASection.tsx
  - src/components/ui/ProductCard.tsx
  - src/components/ui/Skeleton.tsx
  - src/components/ui/LuxurySkeleton.tsx
  - src/components/ui/Button.tsx
  - src/components/ui/Card.tsx
  - src/components/cart/CartDrawer.tsx
  - src/components/cart/CartIcon.tsx
  - src/components/cart/CartItem.tsx
  - src/components/shop/AnimatedFilterBar.tsx
  - src/components/shop/ProductQuickView.tsx
  - src/components/products/ProductInfo.tsx
  - src/components/products/ProductGallery.tsx
  - src/components/products/RelatedProducts.tsx
  - src/components/products/AddToCartButton.tsx
  - src/components/blog/FeaturedPost.tsx
  - src/components/blog/RelatedPosts.tsx
  - src/components/search/SearchBar.tsx
  - src/components/ai/ChatWidget.tsx
  - src/components/ui/CookieConsent.tsx
autonomous: false

must_haves:
  truths:
    - "Site background is warm white/cream (#FAFAF8) — no dark backgrounds on any public page"
    - "Gold (#D4AF37) remains the primary accent color throughout"
    - "Text is near-black (#0a0a0a) not white on light backgrounds"
    - "Navbar reads correctly on white background (no mix-blend-difference bleed)"
    - "Footer is light-colored, not the dark ambient-subtle variant"
    - "Skeleton loaders use light gray not dark backgrounds"
    - "All section components (Hero, Categories, FeaturedProducts, CTA, CreateSection) use light backgrounds"
  artifacts:
    - path: "src/app/globals.css"
      provides: "Flipped CSS variables + updated component classes for light theme"
      contains: "--background: #FAFAF8"
    - path: "tailwind.config.ts"
      provides: "Updated color tokens and gradient definitions"
  key_links:
    - from: "tailwind.config.ts dark.* tokens"
      to: "Component bg-dark, bg-dark-light, bg-dark-lighter classes"
      via: "Tailwind color resolution"
      pattern: "bg-dark"
    - from: "globals.css .glass-card"
      to: "Components using glass-card class"
      via: "CSS class"
      pattern: "glass-card"
    - from: "globals.css .bg-gold-ambient*"
      to: "Footer + section backgrounds"
      via: "CSS utility class"
      pattern: "bg-gold-ambient"
---

<objective>
Flip the Aquad'or site from dark luxury (black/dark backgrounds) to light luxury (warm white/cream backgrounds), maintaining gold accents and switching to near-black text. The result should feel like a high-end fashion/perfume brand — Chanel, Dior aesthetic.

Purpose: Brand refresh to airy, premium white luxury feel.
Output: Fully light-themed site across all public-facing pages and components.
</objective>

<execution_context>
@/home/qualia/.claude/get-shit-done/workflows/execute-plan.md
@/home/qualia/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@src/app/globals.css
@tailwind.config.ts
@src/components/layout/Navbar.tsx
@src/components/layout/Footer.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Flip CSS design system foundation to light theme</name>
  <files>
    src/app/globals.css
    tailwind.config.ts
  </files>
  <action>
    **globals.css — :root variables:**
    - `--background: #FAFAF8` (warm white, not stark)
    - `--foreground: #0a0a0a` (near-black)
    - `--bg-black: #FAFAF8` (remap — no longer black)
    - `--bg-dark: oklch(97% 0.003 85)` (warm cream)
    - `--bg-darker: oklch(95% 0.004 85)` (slightly deeper cream)

    **globals.css — @layer components:**
    - `.section-title`: change `text-white` → `text-black`
    - `.section-subtitle`: change `text-gray-400` → `text-gray-500`
    - `.glass-card`: change `bg-dark-light/80` → `bg-white/80`, keep `backdrop-blur-xl border border-gold/10 rounded-xl`
    - `.glass-card-hover`: change `hover:bg-dark-light` → `hover:bg-white`
    - `.input-base`: change `bg-dark border border-gold/20 ... text-white placeholder-gray-500` → `bg-white border border-gold/20 ... text-black placeholder-gray-400`
    - `.label-base`: change `text-gray-400` → `text-gray-600`
    - `.btn-filter-inactive`: change `text-gray-400` → `text-gray-500`
    - `.skeleton` class: change `bg-dark-lighter` → `bg-gray-200`

    **globals.css — bg-gold-ambient utilities (update base color):**
    Change all 5 ambient background utilities. Each ends with `#000000` or `#0a0a0a` as base — replace with `#FAFAF8`:
    - `.bg-gold-ambient` — base `#000000` → `#FAFAF8`
    - `.bg-gold-ambient-subtle` — base `#000000` → `#FAFAF8`
    - `.bg-gold-ambient-center` — base `#000000` → `#FAFAF8`
    - `.bg-gold-ambient-top` — base `#000000` → `#FAFAF8`
    - `.bg-gold-ambient-dark` — base `#0a0a0a` → `#F5F3EF` (slightly deeper cream for this variant)
    Also increase the gold radial opacity slightly (multiply by ~2x) since they'll be on white not black — e.g., `0.03` → `0.06`, `0.02` → `0.05`.

    **globals.css — .glass-dark utility:**
    Change `background: rgba(0,0,0,0.9)` → `background: rgba(255,255,255,0.95)`, `border: 1px solid rgba(255,255,255,0.1)` → `border: 1px solid rgba(0,0,0,0.08)`

    **globals.css — ::selection:**
    Change `color: #fff` → `color: #000`

    **globals.css — blog-content and product-description:**
    - `text-white` headings → `text-black` (h2, h3, strong)
    - `text-gray-300` body → `text-gray-700`
    - `text-gray-400` blockquotes → `text-gray-600`
    - `.blog-product-card` background: `bg-black/30` → `bg-white/80`
    - `.blog-product-card .blog-product-name`: `text-white` → `text-black`
    - `.blog-faq summary`: `text-white` → `text-black`
    - `.blog-faq details > div`: `text-gray-300` → `text-gray-700`
    - `.product-description` headings `text-white` → `text-black`, body `text-gray-300` → `text-gray-700`

    **tailwind.config.ts — dark color tokens:**
    Remap the dark palette to light equivalents so all `bg-dark-*` classes produce cream/white:
    ```ts
    dark: {
      DEFAULT: "#FAFAF8",      // was #0a0a0a
      light: "#F5F3EF",        // was #1a1a1a
      lighter: "#EDE9E3",      // was #2a2a2a
    },
    ```
    This means `bg-dark` = warm white, `bg-dark-light` = light cream, `bg-dark-lighter` = deeper cream.
    All existing component classes using `bg-dark`, `bg-dark-light`, `bg-dark-lighter` will automatically flip.

    Add a `light-gradient` background image alongside dark-gradient:
    ```ts
    "light-gradient": "linear-gradient(135deg, #FAFAF8 0%, #F5F3EF 50%, #FAFAF8 100%)",
    ```

    **Do NOT touch:** Gold palette, animation/keyframe definitions, spacing variables, typography variables. Admin pages intentionally excluded — admin panel stays dark.
  </action>
  <verify>
    Run `npm run type-check` — should pass (no TS in CSS/tailwind changes).
    Visually: Open `localhost:3000` — page should show cream/white background.
  </verify>
  <done>
    CSS variables flipped to warm white. Tailwind dark.* tokens remapped to cream shades. All ambient background utilities base from #FAFAF8. Blog/product content text updated to dark colors.
  </done>
</task>

<task type="auto">
  <name>Task 2: Sweep components — fix hardcoded dark/white class usages</name>
  <files>
    src/components/layout/Navbar.tsx
    src/components/layout/Footer.tsx
    src/components/home/Hero.tsx
    src/components/home/Categories.tsx
    src/components/home/FeaturedProducts.tsx
    src/components/home/CreateSection.tsx
    src/components/home/CTASection.tsx
    src/components/ui/ProductCard.tsx
    src/components/ui/Skeleton.tsx
    src/components/ui/LuxurySkeleton.tsx
    src/components/ui/Button.tsx
    src/components/ui/Card.tsx
    src/components/cart/CartDrawer.tsx
    src/components/cart/CartIcon.tsx
    src/components/cart/CartItem.tsx
    src/components/shop/AnimatedFilterBar.tsx
    src/components/shop/ProductQuickView.tsx
    src/components/products/ProductInfo.tsx
    src/components/products/ProductGallery.tsx
    src/components/products/RelatedProducts.tsx
    src/components/products/AddToCartButton.tsx
    src/components/blog/FeaturedPost.tsx
    src/components/blog/RelatedPosts.tsx
    src/components/search/SearchBar.tsx
    src/components/ai/ChatWidget.tsx
    src/components/ui/CookieConsent.tsx
  </files>
  <action>
    Read each file before editing. Apply these transformation rules consistently:

    **Text color transforms (hardcoded white → black/dark):**
    - `text-white` → `text-black` (headings, labels, primary text)
    - `text-white/80` → `text-black/80`
    - `text-white/70` → `text-black/70`
    - `text-white/60` → `text-black/60`
    - `text-white/40` → `text-black/40`
    - `text-white/[0.04]` → `text-black/[0.06]` (very subtle borders)
    - `text-gray-300` → `text-gray-700` (body text)
    - `text-gray-400` → `text-gray-600` (secondary text, labels)
    - `text-gray-500` → `text-gray-500` (keep as-is, midpoint)
    - `text-gray-600` → keep

    **Background transforms:**
    - `bg-black` → `bg-white` (solid black sections)
    - `bg-black/95` → `bg-white/95` (high-opacity overlays)
    - `bg-black/[0.98]` → `bg-white/[0.98]` (mobile menu overlay)
    - `bg-black/30` → `bg-white/60`
    - `bg-black/60` → `bg-white/60`
    - `bg-dark` → leave as-is (resolves via tailwind token to cream now)
    - `bg-dark-light` → leave as-is (resolves to light cream)
    - `bg-dark-lighter` → leave as-is (resolves to deeper cream)

    **Border transforms:**
    - `border-white/[0.04]` → `border-black/[0.06]`
    - `border-white/10` → `border-black/10`

    **Gradient transforms (hardcoded black gradient strings):**
    - `from-black` → `from-white` in gradient classes
    - `via-black/40` → `via-white/40` (overlay gradients in Hero over video)
    - `from-black/60` → `from-white/60`
    - Inline style `from-black via-dark-light to-black` (Hero error fallback) → `from-[#FAFAF8] via-[#F5F3EF] to-[#FAFAF8]`

    **Navbar — specific changes:**
    - Scrolled state: `bg-black/95` → `bg-white/95`. Shadow stays.
    - `mix-blend-difference` on unscrolled transparent state — REMOVE this class. Replace with no blend mode so links are readable against white page content.
    - Nav link colors: `text-white group-hover:text-gold` → `text-black/80 group-hover:text-gold`
    - Active link: stays `text-gold` (unchanged)
    - Hamburger icon: `text-white hover:text-gold` → `text-black hover:text-gold`
    - Search/cart icons: `text-white hover:text-gold` → `text-black hover:text-gold`
    - Search panel: `bg-black/95` → `bg-white/95`
    - Mobile overlay: `bg-black/[0.98]` inner div → `bg-white/[0.98]`
    - Mobile nav links: `text-white/70` → `text-black/70`, `active:text-gold` stays
    - Mobile footer text: `text-gray-600` → `text-gray-400`
    - Desktop separator: `bg-white/[0.08]` → `bg-black/[0.08]`

    **Footer — specific changes:**
    - `text-white/80` tagline → `text-black/80`
    - Social icons: `text-white/60` → `text-black/60`
    - Link text: `text-white/70 hover:text-white` → `text-black/70 hover:text-black`
    - Contact info: `text-white/70` → `text-black/70`
    - Bottom bar: `text-white/40` → `text-black/40`
    - `border-gold/5` borders stay
    - Footer uses `bg-gold-ambient-subtle` which now renders on cream — good.

    **Hero — specific changes:**
    - Video overlay gradient: `from-black/60 via-black/40 to-black` → `from-black/50 via-black/30 to-black/70` (keep dark overlay ON the video so video text remains legible — hero video is the EXCEPTION, text on video should stay light/gold)
    - The gold ambient glow div stays as-is
    - Hero text (brand name gradient, tagline) stays gold/white — they're ON the dark video overlay, so keep `text-white` for hero copy only

    **CartDrawer — specific changes:**
    - Drawer panel background: change any `bg-dark*` or `bg-black*` → `bg-white`
    - Drawer title and item text: `text-white` → `text-black`, `text-gray-300/400` → `text-gray-600/700`
    - Border colors: `border-white/10` → `border-black/10`

    **ProductQuickView — specific changes:**
    - Modal/overlay background: `bg-black*` → `bg-white*` for the panel itself
    - Overlay backdrop can stay dark: `bg-black/70` stays (it's the dim overlay behind the modal)

    **AnimatedFilterBar — specific changes:**
    - Background of filter bar: if using `bg-dark*` → leave (resolves to cream)
    - Filter button text: `text-gray-400` → `text-gray-600` for inactive state

    **Skeleton / LuxurySkeleton:**
    - Any hardcoded dark skeleton colors → `bg-gray-200` (this also resolves via `.skeleton` class fix in Task 1)
    - Gold shimmer skeletons stay (they look good on white too)

    **CookieConsent:**
    - Background: `bg-dark*` or `bg-black*` → `bg-white border border-black/10`
    - Text: `text-white` → `text-black`, `text-gray-300/400` → `text-gray-600/700`

    **ChatWidget:**
    - Chat panel background: `bg-dark*` or `bg-black*` → `bg-white`
    - Message bubbles: user bubble stays gold, AI bubble: `bg-dark-lighter` → `bg-gray-100`
    - Input area: `bg-dark*` → `bg-gray-50`
    - Text: `text-white` → `text-black`, `text-gray-300/400` → `text-gray-600/700`

    **SearchBar:**
    - Background: `bg-dark*` → `bg-white` or `bg-gray-50`
    - Text: `text-white` → `text-black`, placeholder `text-gray-500` → keep

    **EXCEPTION — DO NOT CHANGE:**
    - Admin components (`src/components/admin/*`) — admin panel stays dark
    - Hero text copy (brand name, tagline, CTA) on top of the video overlay — keep light/gold
    - `bg-black/70` dimming overlays behind modals/drawers (the BACKDROP, not the panel)
    - `text-gold*` classes everywhere — gold stays
    - `border-gold*` classes everywhere — gold stays
    - `bg-gold*` classes — gold stays
    - `3d/` components — 3D canvas background; if it has dark background, leave (R3F canvas manages its own bg)
  </action>
  <verify>
    `npm run build` — must pass with no errors.
    `npm run type-check` — must pass.
    Manual check at localhost:3000: all sections white/cream, text black, gold accents preserved.
  </verify>
  <done>
    All public-facing components use light backgrounds. Text is near-black on cream/white. Gold accents intact. No dark backgrounds on shop, blog, home, cart, product pages. Build passes.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
    Complete white luxury theme flip: CSS foundation + all public components updated from dark to light. Warm cream (#FAFAF8) backgrounds, near-black text, gold (#D4AF37) accents throughout.
  </what-built>
  <how-to-verify>
    1. Visit http://localhost:3000 — homepage should show cream/white background
    2. Check Navbar — links should be dark/black text (not white) against the white page
    3. Scroll to FeaturedProducts, Categories, CTA — all cream/white sections
    4. Visit /shop — filter bar and product grid on white background
    5. Click a product — product page white, text black
    6. Open cart drawer — white panel, dark text
    7. Visit /blog — white background, dark text headings
    8. Check footer — light background, dark text links
    9. Confirm gold accents still visible throughout (borders, buttons, prices, underlines)
    10. Hero section: video still shows with dark overlay, hero text still legible (gold/white on dark video)
  </how-to-verify>
  <resume-signal>Type "approved" if the white luxury theme looks correct, or describe any issues (wrong colors, broken sections, contrast problems)</resume-signal>
</task>

</tasks>

<verification>
- `npm run build` passes
- `npm run type-check` passes
- No dark backgrounds on any public page (homepage, shop, product, blog, cart)
- Gold accents preserved throughout
- Text readable: near-black on cream/white
- Admin panel unaffected (still dark)
- Hero video section retains dark overlay for legibility
</verification>

<success_criteria>
Site loads with warm cream/white aesthetic matching Chanel/Dior luxury brand style. Gold accents provide the only chromatic accent. Near-black text on cream backgrounds. Clean build, no type errors.
</success_criteria>

<output>
After completion, create `.planning/quick/3-white-luxury-theme-with-gold-accents-and/3-SUMMARY.md` with what was changed, any issues encountered, and final state.
</output>
