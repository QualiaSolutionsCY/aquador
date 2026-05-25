-- Consolidate admin dashboard headline metrics into one database-side RPC.
-- The admin server client calls this with the service role; public clients
-- should not execute it directly.

create or replace function public.dashboard_metrics(p_period text default '30d')
returns jsonb
language sql
stable
set search_path = public
as $$
  with selected_period as (
    select case p_period
      when '7d' then 7
      when '90d' then 90
      else 30
    end as days
  ),
  bounds as (
    select
      now() as end_at,
      now() - make_interval(days => days) as start_at,
      now() - make_interval(days => days * 2) as previous_start_at,
      now() - make_interval(days => days) as previous_end_at
    from selected_period
  ),
  current_orders as (
    select
      count(*)::integer as order_count,
      coalesce(sum(total), 0)::integer as revenue_total
    from public.orders, bounds
    where orders.created_at >= bounds.start_at
      and orders.created_at < bounds.end_at
      and orders.status in ('confirmed', 'processing', 'shipped', 'delivered')
  ),
  previous_orders as (
    select coalesce(sum(total), 0)::integer as revenue_total
    from public.orders, bounds
    where orders.created_at >= bounds.previous_start_at
      and orders.created_at < bounds.previous_end_at
      and orders.status in ('confirmed', 'processing', 'shipped', 'delivered')
  ),
  visitor_stats as (
    select count(distinct session_id)::integer as sessions
    from public.site_visitors, bounds
    where site_visitors.last_seen >= bounds.start_at
      and site_visitors.last_seen < bounds.end_at
  ),
  customer_stats as (
    select
      count(*)::integer as total,
      count(*) filter (where coalesce(total_orders, 0) >= 2)::integer as repeat_count,
      coalesce(avg(total_spent), 0)::double precision as avg_ltv,
      count(*) filter (where coalesce(total_spent, 0) < 5000)::integer as ltv_lt50,
      count(*) filter (
        where coalesce(total_spent, 0) >= 5000
          and coalesce(total_spent, 0) < 20000
      )::integer as ltv_lt200,
      count(*) filter (
        where coalesce(total_spent, 0) >= 20000
          and coalesce(total_spent, 0) < 50000
      )::integer as ltv_lt500,
      count(*) filter (where coalesce(total_spent, 0) >= 50000)::integer as ltv_gte500
    from public.customers
  )
  select jsonb_build_object(
    'revenue', jsonb_build_object(
      'current', current_orders.revenue_total,
      'previous', previous_orders.revenue_total,
      'deltaPct', case
        when previous_orders.revenue_total = 0 and current_orders.revenue_total = 0 then 0
        when previous_orders.revenue_total = 0 then 1
        else ((current_orders.revenue_total - previous_orders.revenue_total)::double precision / previous_orders.revenue_total)
      end,
      'currency', 'EUR'
    ),
    'orders', jsonb_build_object(
      'count', current_orders.order_count,
      'aov', case
        when current_orders.order_count = 0 then 0
        else (current_orders.revenue_total::double precision / current_orders.order_count)
      end
    ),
    'conversion', jsonb_build_object(
      'orders', current_orders.order_count,
      'sessions', visitor_stats.sessions,
      'rate', case
        when visitor_stats.sessions = 0 then 0
        else (current_orders.order_count::double precision / visitor_stats.sessions)
      end,
      'source', 'site_visitors'
    ),
    'customers', jsonb_build_object(
      'total', customer_stats.total,
      'repeatCount', customer_stats.repeat_count,
      'avgLtv', customer_stats.avg_ltv,
      'ltvBuckets', jsonb_build_object(
        'lt50', customer_stats.ltv_lt50,
        'lt200', customer_stats.ltv_lt200,
        'lt500', customer_stats.ltv_lt500,
        'gte500', customer_stats.ltv_gte500
      )
    )
  )
  from current_orders, previous_orders, visitor_stats, customer_stats;
$$;

revoke execute on function public.dashboard_metrics(text) from public;
revoke execute on function public.dashboard_metrics(text) from anon;
revoke execute on function public.dashboard_metrics(text) from authenticated;
grant execute on function public.dashboard_metrics(text) to service_role;
