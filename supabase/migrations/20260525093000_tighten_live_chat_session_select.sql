-- Tighten live_chat_sessions reads.
--
-- Visitors only need to create a waiting session. Admin operators need to list
-- sessions from /admin/live-chat. Public notification validation now runs
-- server-side through /api/live-chat/notify, so anon-wide SELECT is no longer
-- required.

DROP POLICY IF EXISTS live_chat_sessions_select_anon ON public.live_chat_sessions;
DROP POLICY IF EXISTS live_chat_sessions_select_admin ON public.live_chat_sessions;

CREATE POLICY live_chat_sessions_select_admin
  ON public.live_chat_sessions
  FOR SELECT
  TO authenticated, service_role
  USING (app_private.is_admin() OR auth.role() = 'service_role');
