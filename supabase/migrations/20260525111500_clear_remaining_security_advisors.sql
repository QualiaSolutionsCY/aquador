-- Clear remaining Supabase Security Advisor warnings from the public API.
--
-- Public storefront flows still keep their required writes:
--   - live agent requests can create a waiting chat session
--   - heartbeat can insert a short-lived visitor row
-- Public image buckets stay public for direct object URLs, but clients cannot
-- list bucket contents through storage.objects.

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

DO $$
DECLARE
  rec record;
  role_list text;
  new_qual text;
  new_check text;
  stmt text;
BEGIN
  FOR rec IN
    SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname IN ('public', 'storage')
      AND (
        COALESCE(qual, '') LIKE '%public.is_admin()%'
        OR COALESCE(with_check, '') LIKE '%public.is_admin()%'
        OR COALESCE(qual, '') ~ '(^|[^[:alnum:]_.])is_admin\(\)'
        OR COALESCE(with_check, '') ~ '(^|[^[:alnum:]_.])is_admin\(\)'
      )
      AND COALESCE(qual, '') NOT LIKE '%app_private.is_admin()%'
      AND COALESCE(with_check, '') NOT LIKE '%app_private.is_admin()%'
  LOOP
    SELECT string_agg(
      CASE
        WHEN r.role_name::text = 'public' THEN 'PUBLIC'
        ELSE quote_ident(r.role_name::text)
      END,
      ', '
    )
    INTO role_list
    FROM unnest(rec.roles) AS r(role_name);

    new_qual := NULL;
    IF rec.qual IS NOT NULL THEN
      new_qual := replace(rec.qual, 'public.is_admin()', 'app_private.is_admin()');
      new_qual := regexp_replace(
        new_qual,
        '(^|[^[:alnum:]_.])is_admin\(\)',
        '\1app_private.is_admin()',
        'g'
      );
    END IF;

    new_check := NULL;
    IF rec.with_check IS NOT NULL THEN
      new_check := replace(rec.with_check, 'public.is_admin()', 'app_private.is_admin()');
      new_check := regexp_replace(
        new_check,
        '(^|[^[:alnum:]_.])is_admin\(\)',
        '\1app_private.is_admin()',
        'g'
      );
    END IF;

    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      rec.policyname,
      rec.schemaname,
      rec.tablename
    );

    stmt := format(
      'CREATE POLICY %I ON %I.%I FOR %s TO %s',
      rec.policyname,
      rec.schemaname,
      rec.tablename,
      rec.cmd,
      role_list
    );

    IF new_qual IS NOT NULL THEN
      stmt := stmt || ' USING (' || new_qual || ')';
    END IF;

    IF new_check IS NOT NULL THEN
      stmt := stmt || ' WITH CHECK (' || new_check || ')';
    END IF;

    EXECUTE stmt;
  END LOOP;
END $$;

DROP POLICY IF EXISTS "blog_images_anon_read" ON storage.objects;
DROP POLICY IF EXISTS "product_images_anon_read" ON storage.objects;

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
    AND last_seen >= now() - interval '15 minutes'
    AND last_seen <= now() + interval '5 minutes'
  );

DO $$
BEGIN
  IF to_regprocedure('public.upsert_customer_on_order(text, text, text, bigint, jsonb)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.upsert_customer_on_order(text, text, text, bigint, jsonb)
      FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.upsert_customer_on_order(text, text, text, bigint, jsonb)
      TO service_role;
  END IF;
END $$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;
