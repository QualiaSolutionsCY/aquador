-- ============================================================
-- Admin perfume intelligence memory
-- Date: 2026-05-24
-- ============================================================
-- Stores generated perfume research reports and operator learning notes.
-- Reports are keyed by normalized perfume name so repeat lookups return
-- quickly before the admin asks for a renewed public research pass.
-- ============================================================

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

CREATE TABLE IF NOT EXISTS public.perfume_intel_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  normalized_query text NOT NULL UNIQUE,
  perfume_name text NOT NULL,
  report jsonb NOT NULL,
  model text NOT NULL,
  web_searched boolean NOT NULL DEFAULT false,
  usage_count integer NOT NULL DEFAULT 1,
  created_by uuid REFERENCES public.admin_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS perfume_intel_reports_last_used_idx
  ON public.perfume_intel_reports (last_used_at DESC);

CREATE TABLE IF NOT EXISTS public.perfume_intel_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  normalized_query text NOT NULL,
  perfume_name text NOT NULL,
  note text NOT NULL CHECK (length(note) BETWEEN 3 AND 1200),
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'auto')),
  created_by uuid REFERENCES public.admin_users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS perfume_intel_memories_query_idx
  ON public.perfume_intel_memories (normalized_query, created_at DESC);

CREATE TABLE IF NOT EXISTS public.perfume_intel_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  normalized_query text NOT NULL,
  perfume_name text NOT NULL,
  requested_name text,
  staff_name text NOT NULL DEFAULT 'marina' CHECK (staff_name IN ('marina', 'mahmoud', 'marcos')),
  input_type text NOT NULL DEFAULT 'text' CHECK (input_type IN ('text', 'image', 'mixed')),
  image_hash text,
  image_mime text,
  report jsonb NOT NULL,
  learned_memories jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES public.admin_users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS perfume_intel_conversations_created_idx
  ON public.perfume_intel_conversations (created_at DESC);

CREATE INDEX IF NOT EXISTS perfume_intel_conversations_query_idx
  ON public.perfume_intel_conversations (normalized_query, created_at DESC);

ALTER TABLE public.perfume_intel_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfume_intel_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfume_intel_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "perfume_intel_reports_admin_all" ON public.perfume_intel_reports;
CREATE POLICY "perfume_intel_reports_admin_all"
  ON public.perfume_intel_reports
  FOR ALL
  TO authenticated
  USING (app_private.is_admin())
  WITH CHECK (app_private.is_admin());

DROP POLICY IF EXISTS "perfume_intel_memories_admin_all" ON public.perfume_intel_memories;
CREATE POLICY "perfume_intel_memories_admin_all"
  ON public.perfume_intel_memories
  FOR ALL
  TO authenticated
  USING (app_private.is_admin())
  WITH CHECK (app_private.is_admin());

DROP POLICY IF EXISTS "perfume_intel_conversations_admin_all" ON public.perfume_intel_conversations;
CREATE POLICY "perfume_intel_conversations_admin_all"
  ON public.perfume_intel_conversations
  FOR ALL
  TO authenticated
  USING (app_private.is_admin())
  WITH CHECK (app_private.is_admin());
