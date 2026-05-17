# Aquad'or Operator Runbook

This is the playbook for running https://www.aquadorcy.com day to day. Each operation below is one self contained recipe: when to run it, what you need first, the steps, how to confirm it worked, and how to undo it if it goes wrong.

For deeper architecture, see `CLAUDE.md` and `.planning/codebase/`. For decisions, see `.planning/decisions/`. For health monitoring, see UptimeRobot at https://stats.uptimerobot.com/bKudHy1pLs.

**Operator:** Fawzi Goussous (Qualia Solutions)
**Production:** https://www.aquadorcy.com
**Repo:** github.com/QualiaSolutionsCY/aquador
**Branch:** main (deploys via `vercel --prod`, auto deploy disabled)
**Supabase:** project ref `hznpuxplqgszbacxzbhv`
**Sentry:** `qualia-solutions/aquador`
**Vercel:** `aquador-next` (Qualia Solutions team)

## 1. Deploying a code change

**When to use:** shipping a new feature, a hotfix, a content update, or a configuration change that must land in production.

**Pre-requisites:** local clone of the repo, `vercel` CLI logged in and linked to project `aquador-next`, `gh` CLI authenticated, push access to the repo.

**Steps:**
1. Create a feature branch off `main`: `git checkout main && git pull && git checkout -b feat/your-change`.
2. Make the change. Run local quality gates: `npm run lint && npm run type-check && npm run test`.
3. Commit and push: `git add <files> && git commit -m "feat: your change" && git push -u origin feat/your-change`.
4. Open a PR: `gh pr create --base main --title "feat: your change" --body "..."`.
5. Self review the diff in the PR view. Confirm no secrets, no `.env`, no debug `console.log`.
6. Merge the PR through GitHub. Auto deploy is disabled per `rules/deployment.md`, so the merge does NOT ship.
7. Pull the merged main locally: `git checkout main && git pull`.
8. Deploy: `vercel --prod` from the repo root. Wait for the build to complete and the new alias to settle.

**Verification:**
1. `curl -s -o /dev/null -w "%{http_code}\n" https://www.aquadorcy.com/` returns `200`.
2. `curl -s https://www.aquadorcy.com/api/heartbeat` returns `200` with a fresh timestamp.
3. UptimeRobot board at https://stats.uptimerobot.com/bKudHy1pLs shows all monitors UP.
4. Open https://www.aquadorcy.com/ in a private window. Confirm no critical console errors.

**Rollback:** see §2.

**Notes:** Vercel auto deploy from GitHub is intentionally OFF. The merge gate is the PR review; the deploy gate is the manual `vercel --prod` call. Treat them as two separate decisions.

## 2. Rolling back a failed deploy

**When to use:** post deploy smoke fails, Sentry error rate spikes, conversion drops within the first hour after a ship, or a user reports a regression on the live site.

**Pre-requisites:** `vercel` CLI logged in and linked to `aquador-next`.

**Steps:**
1. List recent deployments: `vercel ls aquador-next` (the most recent production deployment is at the top).
2. Identify the last known good deployment URL. The one right before the current active alias is usually it.
3. Promote it: `vercel promote <deployment-url-from-step-2>`.
4. Confirm the production alias now points at the rollback target: `vercel inspect https://www.aquadorcy.com`.
5. Notify any active operator or developer that production has been rolled back so they do not push on top of the bad commit.

**Verification:**
1. `curl -s -o /dev/null -w "%{http_code}\n" https://www.aquadorcy.com/` returns `200`.
2. Sentry issue rate returns to baseline within 5 minutes.
3. UptimeRobot board shows all monitors UP.

**Rollback:** if the rollback target is also broken, promote an even older deployment. Vercel retains deployment history indefinitely.

**Notes:** rollback is instant DNS aliasing, no rebuild needed. The bad commit stays in `main`; revert it locally with `git revert <sha>` and ship the revert through §1.

## 3. Refunding a Stripe order

**When to use:** a customer requests a refund, a chargeback comes in from the bank, or a duplicate charge is detected.

**Pre-requisites:** Stripe Dashboard access in live mode for the Aquad'or account.

**Steps:**
1. Open https://dashboard.stripe.com/payments.
2. Search by customer email or by payment ID. Open the matching payment.
3. Click "Refund". Choose full or partial. For partial, enter the amount in EUR.
4. Select the reason code (`requested_by_customer`, `duplicate`, `fraudulent`).
5. Click "Refund" to confirm.

**Verification:**
1. The payment timeline on the Stripe payment page shows a `charge.refunded` event.
2. The customer receives an automated refund email from Stripe.
3. In Supabase SQL editor, run `select id, status, payment_status from orders where stripe_payment_intent_id = '<pi_...>';`. The webhook handler at `src/app/api/webhooks/stripe/route.ts` should have updated the order row to reflect the refund.

**Rollback:** Stripe refunds cannot be reversed once issued. If a refund was issued in error, the customer must place a new order or be invoiced manually.

**Notes:** refunds via the Stripe Dashboard fire the `charge.refunded` webhook into our handler at `src/app/api/webhooks/stripe/route.ts`. Manual Supabase edits are NOT required in the normal flow. If the webhook fails (check Stripe Dashboard > Developers > Webhooks > recent events), retry it from the Stripe UI before considering a manual order update.

## 4. Resetting the admin password

**When to use:** an admin is locked out, a password is forgotten, or a credential rotation is scheduled.

**Pre-requisites:** Supabase Dashboard access OR a working `SUPABASE_SERVICE_ROLE_KEY` for the project.

**Steps:** choose Option A (Supabase Dashboard, preferred) or Option B (CLI via the Admin API).

**Steps (Option A, Dashboard):**
1. Open https://supabase.com/dashboard/project/hznpuxplqgszbacxzbhv.
2. Navigate to Authentication then Users.
3. Find the admin by email. Click the row.
4. Click "Send password recovery". The admin receives a reset email at the configured address.
5. The admin clicks the link, sets a new password through the Supabase hosted flow.

**Steps (Option B, CLI):**
1. Export the service role key: `export SUPABASE_SERVICE_ROLE_KEY=<value>`.
2. Use the Supabase Admin API via curl to trigger the recovery email:
   ```bash
   curl -X POST "https://hznpuxplqgszbacxzbhv.supabase.co/auth/v1/recover" \
     -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@example.com"}'
   ```
3. The admin receives the same recovery email and proceeds as in Option A.

**Verification:**
1. The reset email arrives at the admin's inbox within 60 seconds.
2. After the admin sets a new password, login at https://www.aquadorcy.com/admin/login succeeds.
3. The admin lands on `/admin` with full access.

**Rollback:** if the wrong email was triggered, no action is needed. The reset link expires in 60 minutes. If the password was changed in error, repeat the procedure to set a fresh one.

**Notes:** the `admin_users` table membership is the actual authorization gate (the middleware at `src/middleware.ts` checks it on every `/admin/*` request). Resetting the auth password does NOT remove the admin role. To revoke admin access, delete the row from `admin_users` in the Supabase SQL editor.

## 5. Restoring a Supabase DB backup

**When to use:** a bad migration corrupted data, a row was accidentally deleted in production, or a schema change needs to be reverted past the migration boundary.

**Pre-requisites:** Supabase Dashboard access. Backups must exist (daily auto backup on Free tier, point in time recovery on Pro).

**Steps:**
1. Open https://supabase.com/dashboard/project/hznpuxplqgszbacxzbhv.
2. Navigate to Database then Backups.
3. Choose the backup that pre dates the corruption. Confirm the timestamp matches your intent.
4. Click "Restore". Choose either restore in place (destructive, replaces current DB) OR restore to a new project (safe, lets you copy the needed rows back manually).
5. If restoring in place, type the confirmation phrase Supabase requires.
6. Wait for the restore to complete (typical: 2 to 10 minutes depending on DB size).

**Verification:**
1. Open the Supabase SQL editor.
2. Spot check the restored rows: `select count(*) from orders;` and compare against the expected pre incident count.
3. Run `npx supabase db diff` from the local repo to confirm schema matches the latest migration file in `supabase/migrations/`.
4. Hit https://www.aquadorcy.com/api/heartbeat: a `200` confirms the application can still read the DB.

**Rollback:** if the restore made things worse, restore from an even earlier backup. The destructive in place restore replaces the DB wholesale; there is no undo for the restore itself other than another restore.

**Notes:** for any uncertain restore, prefer the "restore to new project" path. You can then connect to the new project via SQL editor, extract only the rows you need, and apply them surgically to the live project. Heartbeat at `/api/heartbeat` returns `200` when the DB is up, so use it as the smoke test after restore.

## 6. Reading and triaging a Sentry alert

**When to use:** an email or Slack alert fires from project `qualia-solutions/aquador`, OR the Sentry dashboard shows a new unresolved issue at HIGH severity.

**Pre-requisites:** Sentry Dashboard access for org `qualia-solutions`, project `aquador`.

**Steps:**
1. Open the issue link from the alert (or browse to https://qualia-solutions.sentry.io/issues/ filtered by project `aquador`).
2. Read the Tags panel: release, user (anonymous ID or email if logged in), browser, URL, route.
3. Read the Breadcrumbs panel: the request path, prior actions, console logs leading up to the error.
4. Read the Stacktrace. The top frame is the failing call. Source maps should resolve to a real file under `src/`.
5. Assign the issue to yourself in Sentry.
6. Decide the triage outcome:
   - **Real bug:** file a GitHub issue with `gh issue create --title "<short title>" --body "Sentry: <issue-permalink>\n\n<repro steps>"`. Hotfix per §1.
   - **False positive:** click "Resolve" in Sentry with a comment explaining why.
   - **Duplicate:** click "Merge" and link to the canonical issue.

**Verification:**
1. The Sentry issue status is Assigned or Resolved (not Unresolved).
2. If a fix is needed, a `gh issue` exists with the Sentry permalink in the body.
3. After the hotfix ships, the issue count for that fingerprint stops growing within one release cycle.

**Rollback:** Sentry actions are reversible from the issue page. "Reopen" undoes a resolve; "Unassign" undoes an assign.

**Notes:** the Sentry baseline at `.planning/archive/milestone-4-handoff/sentry-baseline.md` records the unresolved count at handoff time. The HAND-04 success criterion is fewer than 5 unresolved HIGH plus CRITICAL issues. Use that baseline as the comparison point when judging whether a new alert wave is normal or a regression.

## 7. Creating a manual order

**When to use:** a phone order, an in store sale, a comp order for a press contact, a replacement shipment for a damaged delivery.

**Pre-requisites:** admin access at https://www.aquadorcy.com/admin.

**Steps:** use the admin UI path (preferred). If the manual order button is not yet wired on the current build, use the SQL fallback below.

**Steps (admin UI path, preferred):**
1. Log in at `/admin/login` and navigate to `/admin/orders`.
2. Click "New manual order".
3. Choose the customer: search by email, OR click "New customer" and enter name, email, phone.
4. Add line items from the product catalogue. For each item, set the variant and quantity. Override the unit price if the order has a custom rate (comp, employee discount).
5. Set shipping address (or mark as in store pickup).
6. Set the order status: `pending` (awaiting fulfillment), `processing` (being packed), `complete` (handed off).
7. Optionally send a confirmation email to the customer.
8. Click "Save".

**Steps (SQL fallback, if the admin UI button is not wired yet):**
1. Open the Supabase SQL editor.
2. Insert the customer first if new:
   ```sql
   INSERT INTO customers (email, full_name, phone)
   VALUES ('customer@example.com', 'Customer Name', '+357 99 123456')
   RETURNING id;
   ```
3. Insert the order with `source = 'manual'` and `payment_method = 'manual'`:
   ```sql
   INSERT INTO orders (customer_id, status, payment_status, payment_method, source, currency, total_amount)
   VALUES ('<customer-uuid>', 'processing', 'paid', 'manual', 'manual', 'EUR', 49.99)
   RETURNING id;
   ```
4. Insert line items into `order_items` keyed on the returned order ID and product variant IDs.
5. Refresh `/admin/orders`; the new row should appear at the top.

**Verification:**
1. The order row appears in `/admin/orders` with the expected status, customer, and total.
2. In Supabase SQL editor: `select id, source, payment_method, total_amount from orders order by created_at desc limit 5;` shows the new row with `source = 'manual'`.
3. If a confirmation email was sent, the customer receives it within 60 seconds (Resend dashboard logs the delivery).

**Rollback:** to void a manual order, set its status to `cancelled` in `/admin/orders` (or `update orders set status = 'cancelled' where id = '<order-uuid>';` in the SQL editor). Manual orders have no Stripe payment intent, so there is nothing to refund through Stripe.

**Notes:** manual orders skip the Stripe checkout flow entirely. They carry no `stripe_payment_intent_id` and are tagged `payment_method = 'manual'` and `source = 'manual'` for downstream reporting. The schema is in `supabase/migrations/20260224_manual_orders.sql`. If the admin UI does not yet expose the manual order button on a given build, the SQL fallback above is the correct path.

## 8. Publishing a blog post

**When to use:** scheduled editorial cadence, a seasonal piece (Valentine's, summer, festive), a product story or brand collaboration.

**Pre-requisites:** admin access. A featured image uploaded to the Supabase Storage bucket `blog-images` (or an absolute public URL).

**Steps:**
1. Log in at `/admin/login` and navigate to `/admin/blog`.
2. Click "New post".
3. Enter the title. The slug auto generates from the title; override it if SEO requires a different value.
4. Choose the category from the dropdown.
5. Upload the featured image OR paste an existing image URL. This image doubles as the Open Graph preview.
6. Write the body in the markdown editor. Use H2 and H3 for structure. Include alt text on every image.
7. Set the meta description (160 characters maximum) for SEO.
8. Click "Preview" and review the post on a private window.
9. Set `status` to `published`. Click "Save".

**Verification:**
1. `https://www.aquadorcy.com/blog/<slug>` returns `200` with the title and body rendered.
2. The post appears at the top of `https://www.aquadorcy.com/blog`.
3. View page source on the post URL: confirm `<script type="application/ld+json">` includes an `Article` schema with the post title and image.
4. `https://www.aquadorcy.com/sitemap.xml` includes the new slug after the next ISR revalidation (60 seconds).

**Rollback:** to unpublish, navigate to the post in `/admin/blog`, set `status` to `draft`, and save. The route immediately returns `404` after the next ISR cycle. To delete permanently, click "Delete" in the admin row; the row is removed from `blog_posts`.

**Notes:** posts use Article JSON LD on the post route (`src/app/blog/[slug]/page.tsx`) for SEO. The featured image is also the OG image, so use a 1200x630 minimum for social previews. The blog list at `/blog` is statically generated with ISR (60 second revalidation), so a freshly published post can take up to a minute to appear on the index.

## 9. Updating store settings

**When to use:** shipping rates change, free shipping threshold changes, contact email rotates, working hours change, hero copy needs a tweak.

**Pre-requisites:** admin access.

**Steps:**
1. Log in at `/admin/login` and navigate to `/admin/settings`.
2. Locate the setting field. Edit the value in place.
3. Click "Save". The value writes to the `store_settings` table in Supabase.
4. For settings that drive ISR cached routes (hero copy, free shipping banner), trigger a revalidation by visiting the affected page once (the first request after the ISR window will refresh).

**Verification:**
1. Load the affected route (`/`, `/shop`, `/contact`) and confirm the new value renders.
2. In the Supabase SQL editor: `select key, value, updated_at from store_settings order by updated_at desc limit 10;` confirms the write landed.

**Rollback:** edit the field back to the previous value in `/admin/settings` and save. The previous value is also visible in the `store_settings` `updated_at` history if audit logging is enabled.

**Notes:** the `store_settings` table holds dynamic operational values: shipping thresholds, working hours, contact email, free shipping banner copy. The schema is in `supabase/migrations/20260516000001_store_settings.sql`. Settings that live in static Next.js segments (some hero copy, footer copy) may require a code change and a Vercel deploy per §1; check the relevant component before editing.

## 10. Managing product cohorts

**When to use:** launching a curated drop, editing a featured set, tagging a customer segment for a campaign, retiring a cohort after a launch ends.

**Pre-requisites:** admin access. Familiarity with the cohort schema in `customer_cohorts` (see `supabase/migrations/20260515082534_customer_cohorts.sql`).

**Steps:**
1. Log in at `/admin/login`.
2. To assign a cohort to a customer: navigate to `/admin/customers`, open the customer detail at `/admin/customers/<id>`, scroll to the Cohorts section, add or remove cohort tags, save.
3. To filter products by cohort or tag products to a cohort: navigate to `/admin/products`, use the cohort filter column to view membership, edit a product to update its cohort association, save.
4. For bulk operations (assigning many customers to one cohort), use the Supabase SQL editor:
   ```sql
   INSERT INTO customer_cohorts (customer_id, cohort_key)
   SELECT id, 'spring-2026-launch' FROM customers WHERE created_at > '2026-03-01';
   ```

**Verification:**
1. The cohort filter on `/admin/products` (or `/admin/customers`) shows the correct membership count.
2. In the Supabase SQL editor: `select cohort_key, count(*) from customer_cohorts group by cohort_key;` confirms the assignment.
3. If the cohort drives a storefront category page, that page reflects the change after the next ISR cycle (60 seconds).

**Rollback:** to remove a cohort assignment, delete the row from `customer_cohorts` in the admin UI or via SQL:
```sql
DELETE FROM customer_cohorts WHERE cohort_key = 'spring-2026-launch';
```

**Notes:** cohorts are an internal segmentation tool, not a customer facing feature. They were added in M4 P1 alongside the `orders.customer_id` FK adoption work (see migration `20260516000002_orders_customer_id_backfill.sql`). Use cohorts for campaign targeting, curated drops, and reporting; do not expose cohort keys in storefront URLs or copy.

## Credentials inventory

Operator credentials are NOT stored in this repo. The inventory lives in the Qualia Solutions 1Password vault under "Aquad'or, Production":

- Vercel (team membership plus project deploy hook)
- Supabase (project URL, anon key, service role key, dashboard login)
- Stripe (publishable key, secret key, webhook signing secret, dashboard login)
- Sentry (DSN, auth token, dashboard login)
- Resend (API key, sending domain)
- OpenRouter (API key)
- Upstash Redis (REST URL plus token, if configured)
- UptimeRobot (dashboard login)
- Cloudflare or domain registrar (DNS access for aquadorcy.com)

Each entry is verified live by the operator at handoff: log in, confirm the credential resolves, refresh the token if needed.

## When something is broken

1. Check UptimeRobot at https://stats.uptimerobot.com/bKudHy1pLs. Is the site even up?
2. Check Sentry. What is the error and on what route?
3. Check Vercel deployment logs (`vercel inspect <url>` or the Dashboard). Was the last deploy clean?
4. Check Supabase status. Is the DB up? Run `curl https://www.aquadorcy.com/api/heartbeat`.
5. If all four are clean and a user is reporting a bug: reproduce locally, file a `gh issue`, hotfix per §1.

## Bootstrapping an admin user

Admin accounts are provisioned manually through the Supabase Dashboard. There is no in app bootstrap endpoint; the previous `/api/admin/setup` route is permanently disabled and returns `404`. To provision a new admin:

1. Open the Supabase project `hznpuxplqgszbacxzbhv` in the Supabase Dashboard.
2. Navigate to Authentication then Users then "Invite user".
3. Enter the operator's email and send the invite. The operator confirms and sets a password through the Supabase hosted flow.
4. Copy the returned user UUID from the Users table (column `id`).
5. Open the SQL editor and run:
   ```sql
   INSERT INTO admin_users (id, email, role)
   VALUES ('<uuid>', '<email>', 'super_admin');
   ```
6. Verify by signing in at `https://www.aquadorcy.com/admin/login`.

To revoke admin access, delete the corresponding row from `admin_users`. The Supabase auth user can be left in place or deleted from Authentication then Users depending on whether they retain any non admin role.

## Last updated

2026-05-17. M4 P4 Handoff (v3.0).
