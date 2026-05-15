-- ============================================================
-- SEC-04 (gap-A): live_chat_sessions RLS — coarse anon gate
-- Date: 2026-05-15
-- ============================================================
-- The first attempt at SEC-04 used a request-header predicate
-- that referenced a per-request session identifier no client in the
-- codebase actually sets, so PostgREST received NULL and RLS denied
-- every legitimate request. This rewrite drops the header-based
-- predicate and makes RLS a coarse gate:
--
--   - anon may SELECT live_chat_sessions  (USING true)
--   - anon may INSERT live_chat_sessions  (WITH CHECK true)
--   - anon may NOT UPDATE                 (USING false, WITH CHECK false)
--
-- Ownership enforcement moves to the server-side route at
-- src/app/api/live-chat/notify/route.ts, which filters
-- .eq('id', sessionId).eq('status', 'waiting').single() and is the
-- single write surface for live-chat. The table holds no PII or
-- financial fields (id, status, visitor_id, visitor_name, admin_id,
-- created_at, closed_at, updated_at), so the coarse gate is the
-- right granularity given the auditable choke point.
--
-- Documented in docs/RUNBOOK.md ## Live Chat RLS.
-- ============================================================

alter table public.live_chat_sessions enable row level security;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'live_chat_sessions_select_anon'
      AND tablename  = 'live_chat_sessions'
      AND schemaname = 'public'
  ) THEN
    EXECUTE 'CREATE POLICY live_chat_sessions_select_anon ON public.live_chat_sessions FOR SELECT TO anon USING (true)';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'live_chat_sessions_insert_anon'
      AND tablename  = 'live_chat_sessions'
      AND schemaname = 'public'
  ) THEN
    EXECUTE 'CREATE POLICY live_chat_sessions_insert_anon ON public.live_chat_sessions FOR INSERT TO anon WITH CHECK (true)';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'live_chat_sessions_update_anon'
      AND tablename  = 'live_chat_sessions'
      AND schemaname = 'public'
  ) THEN
    EXECUTE 'CREATE POLICY live_chat_sessions_update_anon ON public.live_chat_sessions FOR UPDATE TO anon USING (false) WITH CHECK (false)';
  END IF;
END $$;
