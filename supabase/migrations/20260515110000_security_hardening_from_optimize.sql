-- Security hardening migration — applied during /qualia-optimize after the
-- backend audit identified CRITICAL + HIGH + MEDIUM RLS / function findings.
--
-- Audit source: backend-optimize agent report, M3 close polish.
--
-- This migration is idempotent. Every DROP / ALTER / REVOKE uses
-- IF EXISTS so it can be safely re-applied after partial failure.

-- ----------------------------------------------------------------------------
-- CRITICAL · C1
-- The `products` storage bucket had two legacy anon-write policies that let
-- any unauthenticated visitor INSERT or UPDATE objects under that bucket.
-- The admin-gated sibling policies (`Admins can upload product images`,
-- `Admins can delete product images`) already cover the legitimate operator
-- path. Drop the legacy policies so writes require auth.uid() membership in
-- admin_users.
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Allow public uploads to products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates to products bucket" ON storage.objects;

-- ----------------------------------------------------------------------------
-- HIGH · H5
-- `live_chat_messages` had two contradictory permissive SELECT policies:
--   * "Anyone can read messages" — role public, USING (true)         (LEAK)
--   * "Visitors can read messages for accessible sessions" — anon, USING (false)
-- The permissive union meant every customer-support exchange was world-
-- readable via the anon key. Drop the open one; the visitor-scoped policy
-- remains as the only anon SELECT (it currently denies anon and routes the
-- read through service-role on the admin/operator surface — that is the
-- intended posture until a per-visitor session token is wired through).
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Anyone can read messages" ON public.live_chat_messages;

-- ----------------------------------------------------------------------------
-- HIGH · H4
-- `upsert_customer_on_order(text, text, text, bigint, jsonb)` is
-- SECURITY DEFINER and granted EXECUTE to anon + authenticated. Its name
-- implies an unguarded customer mutation; anonymous callers should not be
-- able to invoke it via PostgREST /rpc. Revoke from anon + authenticated;
-- service_role keeps EXECUTE for the Stripe webhook path.
-- ----------------------------------------------------------------------------

REVOKE EXECUTE ON FUNCTION public.upsert_customer_on_order(text, text, text, bigint, jsonb)
  FROM anon, authenticated;

-- `is_admin()` is SECURITY DEFINER and was granted to anon. It's load-bearing
-- inside RLS predicates (authenticated needs to call it), but anon never
-- legitimately needs the answer.
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;

-- ----------------------------------------------------------------------------
-- MEDIUM · M5
-- Trigger function `store_settings_set_updated_at` ran with a mutable
-- search_path (Supabase advisor `function_search_path_mutable`). Pin it to
-- public, pg_temp so a poisoned search_path can't redirect calls.
-- ----------------------------------------------------------------------------

ALTER FUNCTION public.store_settings_set_updated_at() SET search_path TO 'public', 'pg_temp';

-- ----------------------------------------------------------------------------
-- LOW · L2
-- `live_chat_sessions.admin_id` foreign key has no covering index. The
-- table is small now but the operator-side "my open chats" query will
-- table-scan as adoption grows.
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_live_chat_sessions_admin_id
  ON public.live_chat_sessions(admin_id);

-- ----------------------------------------------------------------------------
-- LOW · L4
-- admin_users_delete / admin_users_update policies were granted to role
-- `public` (which includes anon). The predicate `id = auth.uid()` denies
-- anon in practice (auth.uid() is null), but the role label is sloppy.
-- Narrow to `authenticated` for clarity and to satisfy `policy_role_check`.
-- ----------------------------------------------------------------------------

ALTER POLICY admin_users_delete ON public.admin_users TO authenticated;
ALTER POLICY admin_users_update ON public.admin_users TO authenticated;
