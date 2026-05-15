-- SEC-04: live_chat_sessions session-id-scoped RLS
-- Date: 2026-05-15
-- Adds three policies named live_chat_sessions_{select,insert,update}_owner
-- using the x-session-id request header as the session-ownership predicate.
-- Documented in docs/RUNBOOK.md ## Live Chat RLS.

alter table public.live_chat_sessions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'live_chat_sessions_select_owner'
      and tablename = 'live_chat_sessions'
  ) then
    execute $sql$
      create policy live_chat_sessions_select_owner
        on public.live_chat_sessions
        for select
        using (id::text = current_setting('request.header.x-session-id', true))
    $sql$;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'live_chat_sessions_insert_owner'
      and tablename = 'live_chat_sessions'
  ) then
    execute $sql$
      create policy live_chat_sessions_insert_owner
        on public.live_chat_sessions
        for insert
        with check (id::text = current_setting('request.header.x-session-id', true))
    $sql$;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'live_chat_sessions_update_owner'
      and tablename = 'live_chat_sessions'
  ) then
    execute $sql$
      create policy live_chat_sessions_update_owner
        on public.live_chat_sessions
        for update
        using (id::text = current_setting('request.header.x-session-id', true))
        with check (id::text = current_setting('request.header.x-session-id', true))
    $sql$;
  end if;
end $$;
