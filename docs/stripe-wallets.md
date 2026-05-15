# Stripe Wallets Runbook (Apple Pay + Google Pay)

Operator-facing runbook for surfacing Apple Pay and Google Pay on the Stripe-hosted Checkout pages used by aquadorcy.com.

## Why this matters

Maria, our reference mobile shopper, completes checkout in under six minutes from a phone over 4G. That budget assumes she taps an Apple Pay button on the Stripe-hosted Checkout page and authenticates with Face ID instead of typing a 16-digit card number, a CVC, and a billing address on a touch keyboard. If Apple Pay and Google Pay do not surface on the hosted Checkout, the entire mobile flow collapses to manual card entry, conversion drops, and the v3 promise of a calm, one-tap finish goes with it. Wallet surfacing is governed by Stripe Dashboard configuration, not by code, which means a deploy can succeed, the site can look healthy, and wallets can still be silently missing because a Dashboard checkbox was never ticked or a domain verification file was never uploaded. This document is the explicit owner and the explicit URL for that step.

## Prerequisites

- Live-mode Stripe account connected to the Aquad'or Cyprus business entity.
- Custom domain aquadorcy.com pointing at the production Vercel deployment, with a valid TLS certificate (Vercel-managed cert is fine).
- Stripe Dashboard owner access (or admin role with permission to edit Payment methods).
- Ability to upload a file to the production web root at `/.well-known/apple-developer-merchantid-domain-association` (Vercel: commit to `public/.well-known/` and redeploy).

## Dashboard steps (Apple Pay)

1. Open Stripe Dashboard in live mode.
2. Navigate: Settings then Payment methods then Apple Pay then Configure.
3. Click "Add new domain".
4. Enter `aquadorcy.com`.
5. Click "Download verification file". Stripe issues a file named `apple-developer-merchantid-domain-association` (no extension).
6. Upload that file to the production web root so it is served at `https://aquadorcy.com/.well-known/apple-developer-merchantid-domain-association` with HTTP 200 and `Content-Type: text/plain`. On Vercel, place the file at `public/.well-known/apple-developer-merchantid-domain-association` in the repo and redeploy.
7. Back in the Dashboard, click "Verify". Stripe fetches the URL and confirms the contents match.
8. Confirm the domain row shows status "Verified".

## Dashboard steps (Google Pay)

1. Open Stripe Dashboard in live mode.
2. Navigate: Settings then Payment methods then Google Pay.
3. Toggle "Enable for Checkout" on.
4. Save. No domain verification file is required for Google Pay on Stripe-hosted Checkout; Stripe handles the merchant identity on its own surface.

## Code-side contract

The Checkout Session is created by `src/app/api/checkout/route.ts`. That route MUST NOT set `payment_method_types` on the `stripe.checkout.sessions.create(...)` call. Omitting the field tells Stripe to surface every payment method enabled in the Dashboard for this account, which is the only way Apple Pay and Google Pay reach the hosted Checkout page.

This is decision D-02 from `.planning/phase-4-plan.md`: as of the 2026 Stripe API, `apple_pay` and `google_pay` are NOT valid `PaymentMethodType` enum values for Checkout Sessions. Hard-coding `payment_method_types: ['card']` (or any explicit list) suppresses wallet buttons silently; the call still succeeds, the Checkout page still loads, and wallets simply never appear. If a future contributor reintroduces `payment_method_types` to the create call, wallets disappear in production without any error surfacing. Phase 2.4 Task 2 ships a defensive Jest assertion guarding the absence of that field; do not weaken that guard.

## Verifying wallets surface

After the Dashboard steps are complete, run an end-to-end check in live mode (small real charge) or test mode (note caveat below):

1. iPhone Safari: open the site on aquadorcy.com, add an item to cart, proceed to Checkout, follow the redirect to the Stripe-hosted page. Confirm the Apple Pay button renders above the card form. The device must be signed into iCloud with at least one card in Wallet.
2. Chrome desktop (signed into a Google account with a Google Pay card on file): same flow. Confirm the Google Pay button renders above the card form on the Stripe-hosted page.
3. If both buttons appear, the configuration is correct. Capture a screenshot of the live-mode hosted Checkout page with both wallets visible and attach it to the deploy verification log.

## Troubleshooting

- Wallets hidden in test mode for some accounts. Stripe sometimes suppresses Apple Pay/Google Pay buttons on test-mode Checkout Sessions even when the configuration is correct. If wallets render in live mode, the configuration is correct, regardless of what test mode shows.
- Domain verification expired or invalidated. Re-upload the `.well-known/apple-developer-merchantid-domain-association` file (re-download from Dashboard if the original is lost) and click Verify again. Apple Pay surfacing depends on this file being reachable; if the file 404s the wallet silently disappears.
- User-agent without wallet support shows only card. Apple Pay requires Safari on Apple hardware (or Chrome on macOS with the Apple Pay extension). Google Pay requires Chrome (or Chromium-based browsers) signed into a Google account. Firefox on Linux, for example, will only show the card form, and that is expected.
- Site served from `aquador-next.vercel.app` instead of `aquadorcy.com`. Apple Pay domain verification is bound to the exact domain registered. Wallet buttons will not render on the preview URL. Always test on aquadorcy.com.
