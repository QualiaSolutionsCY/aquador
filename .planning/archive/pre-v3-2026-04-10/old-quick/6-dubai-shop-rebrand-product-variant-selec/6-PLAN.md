# Plan: 6 — Dubai Shop rebrand + product variant selector

**Mode:** quick
**Created:** 2026-03-10

## Task 1: Rename Shop to Dubai Shop + remove type filters

**What:**
- Navbar: Change `{ label: 'Shop', href: '/shop' }` to `{ label: 'Dubai Shop', href: '/shop' }` in `src/components/layout/Navbar.tsx`
- Shop page hero: Change "Our Collections" to "Dubai Shop" and update subtitle in `src/app/shop/ShopContent.tsx`
- Shop page metadata: Update title/description in `src/app/shop/page.tsx`
- Remove the entire `AnimatedTypeFilter` section from ShopContent.tsx (the type filter bar with All Types/Perfume/Essence Oil/Body Lotion)
- Remove the `selectedType` state, `handleTypeChange`, and type-related filter logic from ShopContent.tsx
- Update breadcrumb text "Back to Shop" → "Back to Dubai Shop" in product page
- Update breadcrumb schema Shop → Dubai Shop

**Files:** src/components/layout/Navbar.tsx, src/app/shop/ShopContent.tsx, src/app/shop/page.tsx, src/app/products/[slug]/page.tsx
**Done when:** Nav shows "Dubai Shop", shop page titled "Dubai Shop", type filters gone, breadcrumbs say "Dubai Shop"

## Task 2: Build product variant selector component

**What:** Create a `ProductVariantSelector` client component that lets users choose between product variants:
- **Perfume**: 50ml (€29.99) or 100ml (€49.99)
- **Essence Oil**: 10ml (€19.99)
- **Body Lotion**: 150ml (€29.99)

Design: Premium minimalist pills/tabs. Selected variant has gold accent. Show size and price for each option. When variant changes, the displayed price in ProductInfo and the item added to cart should update.

The component should:
1. Accept current product as prop
2. Expose selected variant (type + size + price) via callback
3. Default to Perfume 50ml
4. Use Framer Motion for smooth transitions between selections

**Files:** src/components/products/ProductVariantSelector.tsx (new), src/components/products/ProductInfo.tsx (modified), src/components/products/AddToCartButton.tsx (modified), src/app/products/[slug]/page.tsx (modified — needs client wrapper for variant state)
**Done when:** Product page shows variant selector, price updates on selection, cart gets correct variant

## Task 3: Wire variant state through product page + ship

**What:** The product detail page is currently a Server Component. We need a client wrapper to hold variant state and pass it to ProductInfo, ProductVariantSelector, and AddToCartButton.

Create a `ProductDetails` client component that:
1. Holds variant state (type, size, price)
2. Renders ProductInfo with overridden price/size/type based on variant
3. Renders ProductVariantSelector
4. Renders AddToCartButton with variant-aware props
5. Premium design: clean spacing, animated price transitions

Then deploy with /ship.

**Files:** src/components/products/ProductDetails.tsx (new), src/app/products/[slug]/page.tsx (modified)
**Done when:** Full variant flow works end-to-end, deployed to production
