-- Subscribers table for homepage email capture (Phase 2.1, HOME-05 / TRUST-03)
create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'homepage',
  created_at timestamptz not null default now()
);

create unique index if not exists subscribers_email_lower_idx
  on public.subscribers (lower(email));

alter table public.subscribers enable row level security;

create policy "subscribers_insert_anon"
  on public.subscribers
  for insert
  to anon, authenticated
  with check (
    email is not null
    and char_length(email) between 5 and 254
    and position('@' in email) > 1
  );

create policy "subscribers_service_role_full"
  on public.subscribers
  for all
  to service_role
  using (true)
  with check (true);

comment on table public.subscribers is
  'Email capture from storefront (homepage and future surfaces). Anon INSERT only; service role for everything else.';
