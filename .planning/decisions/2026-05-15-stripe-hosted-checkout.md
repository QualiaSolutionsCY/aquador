---
adr: "stripe-hosted-checkout"
title: "Stripe-hosted Checkout Session over embedded Payment Element"
date: 2026-05-17
status: Accepted
deciders: Fawzi Goussous (Qualia)
---

# ADR-03: Stripe-hosted Checkout Session over embedded Payment Element

## Context

CART-02 in `REQUIREMENTS.md` originally specified the embedded Stripe
Payment Element for the cart checkout flow. The custom-perfume builder
was scoped against a raw PaymentIntent. The rationale at requirements
time was tighter UI control over the payment form, color-matched to the
storefront chrome.

During Milestone 2 Phase 2.5 the operator decision was made to swap
both payment surfaces to Stripe's hosted Checkout Session. The forcing
function was a combination of:

1. The PCI-DSS SAQ-A scope: an embedded Payment Element pulls the card
   form into our DOM, which keeps us in SAQ-A-EP scope (requires
   quarterly ASV scans and more invasive attestation). Hosted Checkout
   keeps us in SAQ-A (the card form is on `checkout.stripe.com`; we
   never touch card data).
2. The wallet surface: Apple Pay, Google Pay, and Link are first-class
   on hosted Checkout with zero code on our side. Embedded Payment
   Element supports them but requires per-wallet wiring and domain
   verification that we would own.
3. Tax handling: Stripe Tax integration on hosted Checkout is a config
   toggle. Embedded requires us to compute and apply tax server-side.

The cost of the swap is UI control. Hosted Checkout renders on Stripe's
domain with Stripe's typography and layout. Brand-matching is limited
to a logo upload, an accent color, and a button shape via Stripe's
Branding settings.

## Decision

Both payment surfaces use `stripe.checkout.sessions.create`:

- Cart checkout: `src/app/api/checkout/route.ts` line 72 creates the
  Session and returns the redirect URL.
- Custom perfume: `src/app/api/create-perfume/payment/route.ts` line 47
  creates a Session (not a raw PaymentIntent) with perfume composition
  metadata.

Both paths land on `checkout.stripe.com` and redirect back to our own
success page on completion. The success URL pattern is the only
callback contract we own:

- Cart: `/checkout/success?session_id=...`
- Custom: `/create-perfume/success?session_id=...`

The Stripe webhook at `src/app/api/webhooks/stripe/route.ts` is the
canonical source of order truth. The success page renders an
acknowledgment; the webhook writes the order. This is the v1.0 carried
contract from the PROJECT.md Key Decisions table.

## Consequences

What this buys us:

- PCI-DSS SAQ-A scope (Stripe never hands us card data). No quarterly
  ASV scan obligation. No DOM-level card form to audit for XSS.
- Apple Pay, Google Pay, Link, and Klarna available with zero per-wallet
  integration code on our side. Stripe maintains the wallet support
  matrix and we inherit additions.
- Stripe-managed currency formatting, tax calculation, and address
  validation. EUR-only storefront is a one-line Session config.
- A single payment-completion code path (the webhook), regardless of
  whether the order originated from the cart or the custom builder.

What this costs:

- Less UI control over the payment form. We cannot apply our editorial
  typography, hairline borders, or OKLCH palette to the Stripe page.
  Brand-matching is constrained to logo, accent color, and button shape.
- The redirect away from our domain is a soft conversion risk on
  hesitant buyers. Mitigated by Stripe's brand-trust signal (the
  `checkout.stripe.com` URL is recognized by buyers).
- The success-page session_id query parameter is the only handle we
  have on the completed Session. Lose it and the customer loses their
  acknowledgment. The webhook will still record the order correctly,
  but the customer's success page will render generic.

## Reverting Criteria

Revert to the embedded Payment Element only if all of the following hold:

1. A brand-customization requirement cannot be met via Stripe's
   Checkout Branding settings (logo, accent, button shape, custom
   text). Currently no such requirement exists.
2. The PCI-DSS scope cost of moving to SAQ-A-EP is acceptable. This is
   a compliance posture change, not a code change, and requires
   operator sign-off.
3. The wallet support matrix and tax handling can be reimplemented
   server-side without ongoing maintenance cost. Stripe ships new
   wallet types quarterly; matching that cadence in-house is a
   real ongoing investment.

If only some of the above hold, the answer is to push Stripe for
better Checkout customization rather than revert.

## References

- `OPTIMIZE.md` line 49 (High-17 row: "CART-02 documented as embedded
  Payment Element; code uses Stripe-hosted Checkout Session. No ADR
  documents the swap."). This ADR closes High-17.
- `REQUIREMENTS.md` line 58 (CART-02, the superseded requirement that
  this ADR overrides).
- `src/app/api/checkout/route.ts` line 72 (cart Session creation).
- `src/app/api/create-perfume/payment/route.ts` line 47 (custom-perfume
  Session creation; both use `stripe.checkout.sessions.create`).
- `src/app/api/webhooks/stripe/route.ts` (webhook handler, canonical
  order-write path).
- `src/app/checkout/success/` and `src/app/create-perfume/success/`
  (the two success page routes that consume `session_id`).
- `PROJECT.md` line 111 (Key Decisions row: "Stripe webhook is single
  source of truth for orders", carried from v1.0).
- `docs/stripe-wallets.md` (operator runbook for wallet testing).
