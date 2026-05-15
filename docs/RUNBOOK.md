# Aquad'or Operator Runbook

Operator-facing runbook for sensitive administrative tasks on aquadorcy.com that have no in-app UI by design. Each section is the single source of truth for the procedure it documents.

## Bootstrapping an Admin User

Admin accounts on aquadorcy.com are provisioned manually through the Supabase Dashboard. There is no in-app bootstrap endpoint. The previous `/api/admin/setup` route is permanently disabled and returns HTTP 404 for both GET and POST. No environment flag, header, or secret reactivates it. This is intentional: minting a `super_admin` row from an HTTP handler is a permanent attack surface even when gated by a setup key, so the path was removed rather than guarded.

To provision a new admin operator:

1. Open the Supabase project `hznpuxplqgszbacxzbhv` in the Supabase Dashboard.
2. Navigate: Authentication then Users then "Invite user".
3. Enter the operator's email address and send the invite. The operator confirms the invite and sets a password through the Supabase-hosted flow.
4. Once the operator has confirmed, copy the returned user UUID from the Users table (column `id`).
5. Open the SQL editor in the same Supabase project.
6. Run the following statement, substituting the UUID and email from step 4:

   ```sql
   INSERT INTO admin_users (id, email, role)
   VALUES ('<uuid>', '<email>', 'super_admin');
   ```

7. Verify by signing in at `https://aquadorcy.com/admin/login` with the operator's credentials. The middleware in `src/middleware.ts` checks `admin_users` membership on every `/admin/*` request and will redirect to `/admin/login` if the row is missing.

To rotate an existing admin's password, use the same Authentication then Users surface in the Supabase Dashboard ("Send password recovery" or "Update password"). There is no in-app password update endpoint for admins, and the previous `PUT /api/admin/setup` handler has also been removed.

To revoke admin access, delete the corresponding row from `admin_users` in the Supabase SQL editor. The operator's Supabase auth user can be left in place or deleted from Authentication then Users depending on whether they retain any non-admin role.

## Live Chat RLS

Live-chat session data is protected by Row Level Security policies defined in migration `supabase/migrations/20260515000001_live_chat_sessions_rls.sql`. The policies use a coarse anon gate at the DB layer; per-session ownership is enforced by the server-side route. Three policies are defined on the `live_chat_sessions` table:

- `live_chat_sessions_select_anon` — allows SELECT for the `anon` role (`USING (true)`).
- `live_chat_sessions_insert_anon` — allows INSERT for the `anon` role (`WITH CHECK (true)`).
- `live_chat_sessions_update_anon` — denies UPDATE for the `anon` role (`USING (false) WITH CHECK (false)`).

Per-session ownership is enforced in the server-side route at `src/app/api/live-chat/notify/route.ts`, which queries `.eq('id', sessionId).eq('status', 'waiting').single()` before doing anything else. Any future live-chat write surface must go through a server route and use the same explicit filter pattern; do not call Supabase from the browser bundle for live-chat writes.

This is the deliberate choice. `live_chat_sessions` carries no PII or financial fields (columns: `id, status, visitor_id, visitor_name, admin_id, created_at, closed_at, updated_at`), and the single-route write surface gives one auditable choke point. A finer-grained RLS predicate would require either a per-session JWT (overkill for an anonymous chat widget) or a forwarded request header that PostgREST honors (a custom infrastructure to maintain). The coarse-gate-plus-route-filter design avoids both costs.

The notify endpoint at `/api/live-chat/notify` uses `createPublicClient` from `@/lib/supabase/public`, never the service-role admin client. This forces all live-chat writes through RLS, so a bug in the route cannot accidentally bypass the gate. Any future live-chat route added under `/api/live-chat/*` must follow the same pattern — `createPublicClient` only, never `createAdminClient` or `SUPABASE_SERVICE_ROLE_KEY`.

When modifying the policies, edit the migration file in place only before it has been applied to production. After application, write a new migration that drops and recreates the policies; do not edit the original migration. Verify the new policies in the Supabase Dashboard under Authentication then Policies on the `live_chat_sessions` table.
