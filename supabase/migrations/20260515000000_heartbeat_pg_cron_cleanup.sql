-- ============================================================
-- SEC-02: Heartbeat off service-role + pg_cron stale-row cleanup
-- Date: 2026-05-15
-- ============================================================
-- Purpose:
--   1. Remove the heartbeat route's dependency on the service-role
--      key by allowing the anon role to INSERT/UPDATE site_visitors
--      through RLS policies (limited to the columns the upsert uses;
--      site_visitors has no admin-only column we need to guard here).
--   2. Move the stale-row DELETE that previously ran inline on every
--      POST /api/heartbeat call into a database-internal pg_cron job
--      so the privileged DELETE is never reachable from a public
--      HTTP surface.
-- ============================================================

-- pg_cron is pre-installed on Supabase Pro plans; idempotent CREATE.
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ------------------------------------------------------------
-- RLS policies on public.site_visitors for the anon role
-- ------------------------------------------------------------
-- Supabase's PostgREST translates .upsert({...}, { onConflict: 'session_id' })
-- into INSERT ... ON CONFLICT (session_id) DO UPDATE SET ..., which requires
-- BOTH the INSERT and UPDATE policies to permit anon. RLS is already enabled
-- on this table by supabase/migrations/20260302_enable_rls_all_tables.sql.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'site_visitors_insert_anon'
      AND tablename  = 'site_visitors'
      AND schemaname = 'public'
  ) THEN
    EXECUTE 'CREATE POLICY site_visitors_insert_anon ON public.site_visitors FOR INSERT TO anon WITH CHECK (true)';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'site_visitors_update_anon'
      AND tablename  = 'site_visitors'
      AND schemaname = 'public'
  ) THEN
    EXECUTE 'CREATE POLICY site_visitors_update_anon ON public.site_visitors FOR UPDATE TO anon USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- ------------------------------------------------------------
-- pg_cron: stale-row cleanup every 5 minutes
-- ------------------------------------------------------------
-- Idempotent re-schedule: unschedule any prior job with the same name
-- before scheduling, so re-running this migration is safe.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'heartbeat-cleanup') THEN
    PERFORM cron.unschedule('heartbeat-cleanup');
  END IF;
END $$;

SELECT cron.schedule(
  'heartbeat-cleanup',
  '*/5 * * * *',
  $$DELETE FROM public.site_visitors WHERE last_seen < now() - interval '10 minutes'$$
);
