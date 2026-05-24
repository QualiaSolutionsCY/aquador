-- ============================================================
-- Security Advisor cleanup: RLS predicates, public bucket listing, RPC exposure
-- Date: 2026-05-24
-- ============================================================
-- Fixes Supabase Security Advisor warnings:
--   * rls_policy_always_true on anon INSERT policies
--   * public_bucket_allows_listing for public image buckets
--   * anon/authenticated SECURITY DEFINER RPC exposure
--
-- Public image buckets stay public. Direct object URLs keep working without
-- anon SELECT on storage.objects; dropping those policies removes bucket-wide
-- object listing.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Keep the admin RLS helper callable by policies, not by public RPC.
-- ------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS app_private;

REVOKE ALL ON SCHEMA app_private FROM PUBLIC;
GRANT USAGE ON SCHEMA app_private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION app_private.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE id = (SELECT auth.uid())
  ) OR ((SELECT auth.role()) = 'service_role');
$$;

REVOKE ALL ON FUNCTION app_private.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app_private.is_admin() TO authenticated, service_role;

-- The old public helper is no longer referenced by active policies. Revoke
-- direct RPC access so PostgREST cannot expose it to anon/authenticated.
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;

-- Products: public read, admin write.
DROP POLICY IF EXISTS "Admin can insert products" ON public.products;
CREATE POLICY "Admin can insert products"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (app_private.is_admin());

DROP POLICY IF EXISTS "Admin can update products" ON public.products;
CREATE POLICY "Admin can update products"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (app_private.is_admin());

DROP POLICY IF EXISTS "Admin can delete products" ON public.products;
CREATE POLICY "Admin can delete products"
  ON public.products
  FOR DELETE
  TO authenticated
  USING (app_private.is_admin());

-- Blog posts: public published read, admin write.
DROP POLICY IF EXISTS "Admin can insert blog posts" ON public.blog_posts;
CREATE POLICY "Admin can insert blog posts"
  ON public.blog_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (app_private.is_admin());

DROP POLICY IF EXISTS "Admin can update blog posts" ON public.blog_posts;
CREATE POLICY "Admin can update blog posts"
  ON public.blog_posts
  FOR UPDATE
  TO authenticated
  USING (app_private.is_admin());

DROP POLICY IF EXISTS "Admin can delete blog posts" ON public.blog_posts;
CREATE POLICY "Admin can delete blog posts"
  ON public.blog_posts
  FOR DELETE
  TO authenticated
  USING (app_private.is_admin());

-- Gift set inventory: public active read, admin write.
DROP POLICY IF EXISTS "Admin can insert gift sets" ON public.gift_set_inventory;
CREATE POLICY "Admin can insert gift sets"
  ON public.gift_set_inventory
  FOR INSERT
  TO authenticated
  WITH CHECK (app_private.is_admin());

DROP POLICY IF EXISTS "Admin can update gift sets" ON public.gift_set_inventory;
CREATE POLICY "Admin can update gift sets"
  ON public.gift_set_inventory
  FOR UPDATE
  TO authenticated
  USING (app_private.is_admin());

DROP POLICY IF EXISTS "Admin can delete gift sets" ON public.gift_set_inventory;
CREATE POLICY "Admin can delete gift sets"
  ON public.gift_set_inventory
  FOR DELETE
  TO authenticated
  USING (app_private.is_admin());

-- Orders: service role or admin.
DROP POLICY IF EXISTS "Service role and admin can read orders" ON public.orders;
CREATE POLICY "Service role and admin can read orders"
  ON public.orders
  FOR SELECT
  TO authenticated, service_role
  USING (app_private.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role and admin can insert orders" ON public.orders;
CREATE POLICY "Service role and admin can insert orders"
  ON public.orders
  FOR INSERT
  TO authenticated, service_role
  WITH CHECK (app_private.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role and admin can update orders" ON public.orders;
CREATE POLICY "Service role and admin can update orders"
  ON public.orders
  FOR UPDATE
  TO authenticated, service_role
  USING (app_private.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role and admin can delete orders" ON public.orders;
CREATE POLICY "Service role and admin can delete orders"
  ON public.orders
  FOR DELETE
  TO authenticated, service_role
  USING (app_private.is_admin() OR auth.role() = 'service_role');

-- Customers: service role or admin.
DROP POLICY IF EXISTS "Service role and admin can read customers" ON public.customers;
CREATE POLICY "Service role and admin can read customers"
  ON public.customers
  FOR SELECT
  TO authenticated, service_role
  USING (app_private.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role and admin can insert customers" ON public.customers;
CREATE POLICY "Service role and admin can insert customers"
  ON public.customers
  FOR INSERT
  TO authenticated, service_role
  WITH CHECK (app_private.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role and admin can update customers" ON public.customers;
CREATE POLICY "Service role and admin can update customers"
  ON public.customers
  FOR UPDATE
  TO authenticated, service_role
  USING (app_private.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role and admin can delete customers" ON public.customers;
CREATE POLICY "Service role and admin can delete customers"
  ON public.customers
  FOR DELETE
  TO authenticated, service_role
  USING (app_private.is_admin() OR auth.role() = 'service_role');

-- Admin users and analytics reads.
DROP POLICY IF EXISTS "Admin can read admin users" ON public.admin_users;
CREATE POLICY "Admin can read admin users"
  ON public.admin_users
  FOR SELECT
  TO authenticated, service_role
  USING (app_private.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role and admin can read site visitors" ON public.site_visitors;
CREATE POLICY "Service role and admin can read site visitors"
  ON public.site_visitors
  FOR SELECT
  TO authenticated, service_role
  USING (app_private.is_admin() OR auth.role() = 'service_role');

-- Customer cohorts and store settings.
DROP POLICY IF EXISTS "customer_cohorts_admin_all" ON public.customer_cohorts;
CREATE POLICY "customer_cohorts_admin_all"
  ON public.customer_cohorts
  FOR ALL
  TO authenticated
  USING (app_private.is_admin())
  WITH CHECK (app_private.is_admin());

DROP POLICY IF EXISTS "store_settings_admin_insert" ON public.store_settings;
CREATE POLICY "store_settings_admin_insert"
  ON public.store_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (app_private.is_admin());

DROP POLICY IF EXISTS "store_settings_admin_update" ON public.store_settings;
CREATE POLICY "store_settings_admin_update"
  ON public.store_settings
  FOR UPDATE
  TO authenticated
  USING (app_private.is_admin())
  WITH CHECK (app_private.is_admin());

-- Storage writes remain admin-only. Public buckets do not need object listing.
DROP POLICY IF EXISTS "blog_images_anon_read" ON storage.objects;
DROP POLICY IF EXISTS "product_images_anon_read" ON storage.objects;

DROP POLICY IF EXISTS "blog_images_admin_write" ON storage.objects;
CREATE POLICY "blog_images_admin_write"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'blog-images' AND app_private.is_admin());

DROP POLICY IF EXISTS "blog_images_admin_update" ON storage.objects;
CREATE POLICY "blog_images_admin_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'blog-images' AND app_private.is_admin())
  WITH CHECK (bucket_id = 'blog-images' AND app_private.is_admin());

DROP POLICY IF EXISTS "blog_images_admin_delete" ON storage.objects;
CREATE POLICY "blog_images_admin_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'blog-images' AND app_private.is_admin());

DROP POLICY IF EXISTS "product_images_admin_write" ON storage.objects;
CREATE POLICY "product_images_admin_write"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND app_private.is_admin());

DROP POLICY IF EXISTS "product_images_admin_update" ON storage.objects;
CREATE POLICY "product_images_admin_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images' AND app_private.is_admin())
  WITH CHECK (bucket_id = 'product-images' AND app_private.is_admin());

DROP POLICY IF EXISTS "product_images_admin_delete" ON storage.objects;
CREATE POLICY "product_images_admin_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images' AND app_private.is_admin());

-- ------------------------------------------------------------
-- 2. Replace always-true anon INSERT policies with narrow checks.
-- ------------------------------------------------------------

DROP POLICY IF EXISTS live_chat_sessions_insert_anon ON public.live_chat_sessions;
CREATE POLICY live_chat_sessions_insert_anon
  ON public.live_chat_sessions
  FOR INSERT
  TO anon
  WITH CHECK (
    visitor_id IS NOT NULL
    AND length(visitor_id) BETWEEN 1 AND 128
    AND status = 'waiting'
    AND admin_id IS NULL
    AND closed_at IS NULL
    AND (visitor_name IS NULL OR length(visitor_name) <= 120)
  );

DROP POLICY IF EXISTS site_visitors_insert_anon ON public.site_visitors;
CREATE POLICY site_visitors_insert_anon
  ON public.site_visitors
  FOR INSERT
  TO anon
  WITH CHECK (
    session_id IS NOT NULL
    AND length(session_id) BETWEEN 1 AND 128
    AND (page IS NULL OR length(page) <= 512)
    AND (user_agent IS NULL OR length(user_agent) <= 256)
    AND (country IS NULL OR length(country) BETWEEN 2 AND 8)
    AND (ip_hash IS NULL OR ip_hash ~ '^[0-9a-f]{64}$')
    AND last_seen >= now() - interval '10 minutes'
    AND last_seen <= now() + interval '1 minute'
  );

-- Service-role-only permissive policies are not externally facing, but avoid
-- advisor noise by replacing TRUE with the explicit role predicate.
DROP POLICY IF EXISTS "Service role can insert site visitors" ON public.site_visitors;
CREATE POLICY "Service role can insert site visitors"
  ON public.site_visitors
  FOR INSERT
  TO service_role
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can update site visitors" ON public.site_visitors;
CREATE POLICY "Service role can update site visitors"
  ON public.site_visitors
  FOR UPDATE
  TO service_role
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ------------------------------------------------------------
-- 3. Fully revoke the legacy customer-upsert RPC from external roles.
-- ------------------------------------------------------------

DO $$
BEGIN
  IF to_regprocedure('public.upsert_customer_on_order(text, text, text, bigint, jsonb)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.upsert_customer_on_order(text, text, text, bigint, jsonb)
      FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.upsert_customer_on_order(text, text, text, bigint, jsonb)
      TO service_role;
  END IF;
END $$;
