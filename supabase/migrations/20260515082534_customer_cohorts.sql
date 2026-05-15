-- ============================================================
-- Phase 3 Task 3: customer_cohorts — admin-managed segment tags
-- ============================================================
-- Composite primary key (customer_id, cohort) — a customer holds the
-- same cohort label at most once. Inserting a duplicate is a no-op via
-- ON CONFLICT in the API route. Cohort label is a short opaque string
-- (1-32 chars) — the API enforces stricter formatting on top of this.
--
-- RLS: admin-only (read + write). Anonymous and non-admin authenticated
-- users have zero access. `public.is_admin()` is defined in
-- 20260228_fix_rls_policies_and_is_admin.sql and returns TRUE for any
-- auth.uid() that appears in `public.admin_users`, OR for the
-- service_role key. Do NOT redefine is_admin() here.
--
-- Idempotent: table create uses IF NOT EXISTS; policies use
-- DROP POLICY IF EXISTS before CREATE POLICY so re-running is safe.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.customer_cohorts (
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  cohort text NOT NULL CHECK (length(cohort) BETWEEN 1 AND 32),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.admin_users(id),
  PRIMARY KEY (customer_id, cohort)
);

CREATE INDEX IF NOT EXISTS customer_cohorts_customer_id_idx
  ON public.customer_cohorts (customer_id);

CREATE INDEX IF NOT EXISTS customer_cohorts_cohort_idx
  ON public.customer_cohorts (cohort);

ALTER TABLE public.customer_cohorts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customer_cohorts_admin_all" ON public.customer_cohorts;
CREATE POLICY "customer_cohorts_admin_all"
  ON public.customer_cohorts
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
