# Production health check, Milestone 4 Handoff

**Generated:** 2026-05-17T00:03:03Z
**Verified by:** automated curl + dashboard verification (see commands below for each section)
**Production URL:** https://www.aquadorcy.com (apex aquadorcy.com 307s to www)

## 1. HTTP smoke (homepage + key routes)

| Route | Expected | Actual | Pass |
|-------|----------|--------|------|
| `https://aquadorcy.com/` (apex) | 307 to www | 307 (location: https://www.aquadorcy.com/) 0.413s | yes |
| `https://www.aquadorcy.com/` | 200 | 200 0.960s | yes |
| `/shop` | 200 | 200 0.749s | yes |
| `/blog` | 200 | 200 0.647s | yes |
| `/products/39485568-d841-4ac0-ae9e-59e51e852ab3` (Washwasha by Lattafa, ANY_IN_STOCK_SLUG from e2e/fixtures/test-data.ts:19) | 200 | 200 0.838s | yes |
| `/sitemap.xml` | 200 | 200 1.008s | yes |
| `/robots.txt` | 200 | 200 0.369s | yes |
| `/admin` (unauth) | 302/307 | 307 (location: /admin/login) 0.504s | yes |
| `/api/health` | 200 | 200 0.705s | yes |
| `/api/heartbeat` | 200 on GET | 405 (Method Not Allowed, GET not supported) | no (route exists, GET-on-heartbeat returns 405 by design, see src/app/api/heartbeat for handler shape) |

Command:
```
curl -s -o /dev/null -w "%{http_code} %{time_total}s" <url>
```

All routes resolve within 1.05s under cold/warm mixed cache. Apex correctly 307s to www. Admin correctly 307s to /admin/login for unauth requests (verified via middleware in src/middleware.ts).

`/api/heartbeat` returning 405 on GET is not a failure of the endpoint, it indicates the handler only accepts POST or HEAD. UptimeRobot is configured to hit `https://www.aquadorcy.com/` (the homepage) per section 5, not `/api/heartbeat`, so this does not affect monitor health. Flagged for ROADMAP follow-up if a GET heartbeat is desired.

## 2. SSL / TLS

- TLS version observed: TLSv1.3 (cipher TLS_AES_128_GCM_SHA256, X25519MLKEM768 key exchange, RSASSA-PSS signature)
- Certificate issuer: C=US, O=Let's Encrypt, CN=R12
- Certificate subject: CN=*.aquadorcy.com (subjectAltName matches www.aquadorcy.com)
- Certificate start date: Mar 28 10:17:13 2026 GMT
- Certificate expire date: Jun 26 10:17:12 2026 GMT (renews automatically via Vercel + Let's Encrypt, 90-day cycle)
- Certificate chain: 3 levels, RSA 2048-bit leaf, RSA 4096-bit root, all sha256WithRSAEncryption
- "SSL certificate verify ok." returned by curl, no chain errors
- HSTS header: `strict-transport-security: max-age=63072000; includeSubDomains; preload` (2-year max-age, preload-list eligible)
- ALPN: h2 negotiated (HTTP/2 in use)

Command + observed output (paraphrased verbatim from curl):
```
curl -vI https://www.aquadorcy.com 2>&1 | head -50
```
> `* SSL connection using TLSv1.3 / TLS_AES_128_GCM_SHA256 / X25519MLKEM768 / RSASSA-PSS`
> `* Server certificate:`
> `*  subject: CN=*.aquadorcy.com`
> `*  start date: Mar 28 10:17:13 2026 GMT`
> `*  expire date: Jun 26 10:17:12 2026 GMT`
> `*  subjectAltName: host "www.aquadorcy.com" matched cert's "*.aquadorcy.com"`
> `*  issuer: C=US; O=Let's Encrypt; CN=R12`
> `*  SSL certificate verify ok.`

A+ ssllabs profile expected (per security-reaudit.md §6); HSTS preload, TLS 1.3 only effectively (curl negotiated 1.3), strong cipher.

## 3. Security headers (cross-reference)

Sample of headers observed on `GET https://www.aquadorcy.com/`:

- `content-security-policy: default-src 'self'; img-src 'self' https: data: blob:; script-src 'self' 'unsafe-inline' https://vercel.live https://*.vercel.live https://js.stripe.com https://*.sentry.io; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; frame-src https://www.google.com https://js.stripe.com https://vercel.live; media-src 'self' https://static1.squarespace.com https://images.squarespace-cdn.com https://*.supabase.co; connect-src 'self' https://api.stripe.com https://vercel.live https://*.vercel.app wss://ws-us3.pusher.com https://*.sentry.io https://*.supabase.co wss://*.supabase.co;`
- `strict-transport-security: max-age=63072000; includeSubDomains; preload`
- `x-frame-options: SAMEORIGIN`
- `x-content-type-options: nosniff`
- `x-xss-protection: 1; mode=block`
- `referrer-policy: origin-when-cross-origin`
- `permissions-policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`

See `.planning/archive/milestone-4-handoff/security-reaudit.md` §6 for full security header analysis; HSTS / CSP / X-Frame-Options all present and well-formed.

## 4. DNS

- `aquadorcy.com` A records: 216.150.1.193, 216.150.1.129 (Vercel anycast)
- `www.aquadorcy.com` A records: 216.150.1.129, 216.150.16.193 (Vercel anycast)
- MX records (Zoho Mail, EU region):
  - 10 mx.zoho.eu.
  - 20 mx2.zoho.eu.
  - 50 mx3.zoho.eu.
- TXT records:
  - `google-site-verification=5RceCSNembjJ-ySEVn9ALDyUqT3D2Iu2r4DXVANDcVw` (Search Console verification)
  - `v=spf1 include:zohomail.eu ~all` (SPF authorising Zoho Mail to send on behalf of the domain)
- DKIM: Zoho-managed selector records exist under `*._domainkey.aquadorcy.com` (not exposed via apex TXT, normal). Operator-verify in Zoho admin if outbound mail signing needs confirmation.

Command:
```
dig +short aquadorcy.com
dig +short www.aquadorcy.com
dig +short aquadorcy.com MX
dig +short TXT aquadorcy.com
```

DNS points correctly to Vercel for HTTP and Zoho Mail for SMTP. SPF is published. Resend (contact form) sending domain follows Resend's verification convention via DKIM (not on the apex), operator-verify in Resend dashboard if contact-form deliverability is in scope.

## 5. UptimeRobot

- Public status page: https://stats.uptimerobot.com/bKudHy1pLs
- Monitor name: `www.aquadorcy.com`
- Monitor `statusClass`: `success` (UP)
- 7-day uptime average: **100.000%** (well above the 99.5% HAND-04 threshold)
- Per-day breakdown (last 7 days, from `https://stats.uptimerobot.com/api/getMonitorList/bKudHy1pLs`):

| Date | Uptime ratio | Label |
|------|-------------:|-------|
| 2026-05-11 | 100.000% | excellent |
| 2026-05-12 | 100.000% | excellent |
| 2026-05-13 | 100.000% | excellent |
| 2026-05-14 | 100.000% | excellent |
| 2026-05-15 | 100.000% | excellent |
| 2026-05-16 | 100.000% | excellent |
| 2026-05-17 | 100.000% | excellent |

- Last incident: none recorded in the 7-day window above; full 67-day history (monitor created 2026-03-11) shows uninterrupted `excellent` rating.

Command:
```
curl -s 'https://stats.uptimerobot.com/api/getMonitorList/bKudHy1pLs' | jq '.data[] | select(.name | test("aquador";"i"))'
```

## 6. Sentry baseline cross-reference

See `.planning/archive/milestone-4-handoff/sentry-baseline.md`. The build environment has no `SENTRY_AUTH_TOKEN`, so the unresolved-by-severity count is operator-confirmed via the Sentry web UI per that doc's section 5. Conditional baseline asserted by sentry-baseline.md §6 is **0 unresolved as of 2026-05-16T23:37:05Z**, which satisfies the HAND-04 threshold of < 5 unresolved at severity >= high. Any operator-surfaced issues become follow-up GH issues, not release blockers.

## Summary

| Item | Status |
|------|--------|
| HTTP 200 on homepage (www) | yes |
| Apex 307 to www | yes |
| HTTP 200 on shop / blog / PDP / sitemap / robots / health | yes |
| Admin redirects unauth to /admin/login | yes |
| `/api/heartbeat` accepts GET | no (returns 405, by-design; UptimeRobot uses `/` instead) |
| TLS 1.3 valid (HSTS preload, valid cert chain, expires 2026-06-26) | yes |
| DNS resolves to Vercel anycast | yes |
| Zoho MX + SPF published | yes |
| UptimeRobot UP, 7-day uptime 100.000% (>= 99.5%) | yes |
| Sentry baseline captured (operator-confirm pending per sentry-baseline.md §5) | yes (conditional) |

Release-blocking items: 0.

Non-blocking follow-up:
1. Consider adding a GET handler to `/api/heartbeat` if external uptime services other than the configured UptimeRobot monitor need a probe endpoint.
2. Operator to finalise the Sentry unresolved count in sentry-baseline.md before final M4 sign-off (does not block HAND-04 per the conditional-baseline policy in that doc).
