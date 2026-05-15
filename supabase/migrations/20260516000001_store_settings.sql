-- ============================================================
-- Phase 4 Task 2: store_settings — singleton row table
-- ============================================================
-- Persists operator-editable store-wide settings: contact details,
-- shipping/returns policy summaries, free-shipping threshold, Stripe
-- payment-method visibility toggles, default SEO copy.
--
-- Singleton shape: a single row identified by id = 'singleton' (the
-- only legal value, enforced by a CHECK constraint). The /api/admin/
-- settings route reads and updates this one row.
--
-- RLS:
--   * anon SELECT — true. Storefront footer / shipping copy / free
--     shipping threshold are publicly visible; nothing in this table
--     is sensitive.
--   * authenticated SELECT — true (admin panel reads via cookies-aware
--     server client).
--   * authenticated INSERT — admin-only via public.is_admin().
--   * authenticated UPDATE — admin-only via public.is_admin().
--   * No DELETE policy — the singleton row must never disappear.
--
-- Idempotent: DROP POLICY IF EXISTS before CREATE POLICY; seed row
-- uses ON CONFLICT DO NOTHING.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.store_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  contact_email text NOT NULL DEFAULT '',
  contact_phone text NOT NULL DEFAULT '',
  instagram_url text NOT NULL DEFAULT '',
  facebook_url text NOT NULL DEFAULT '',
  shipping_policy_summary text NOT NULL DEFAULT '',
  returns_policy_summary text NOT NULL DEFAULT '',
  free_shipping_threshold_cents integer NOT NULL DEFAULT 3500,
  stripe_payment_enabled boolean NOT NULL DEFAULT true,
  stripe_apple_pay_enabled boolean NOT NULL DEFAULT true,
  stripe_google_pay_enabled boolean NOT NULL DEFAULT true,
  seo_default_title text NOT NULL DEFAULT '',
  seo_default_description text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- anon + authenticated SELECT (public footer copy, free-shipping threshold)
DROP POLICY IF EXISTS "store_settings_anon_read" ON public.store_settings;
CREATE POLICY "store_settings_anon_read"
  ON public.store_settings
  FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "store_settings_authenticated_read" ON public.store_settings;
CREATE POLICY "store_settings_authenticated_read"
  ON public.store_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT — admin only
DROP POLICY IF EXISTS "store_settings_admin_insert" ON public.store_settings;
CREATE POLICY "store_settings_admin_insert"
  ON public.store_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- UPDATE — admin only
DROP POLICY IF EXISTS "store_settings_admin_update" ON public.store_settings;
CREATE POLICY "store_settings_admin_update"
  ON public.store_settings
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Auto-bump updated_at on any UPDATE.
CREATE OR REPLACE FUNCTION public.store_settings_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS store_settings_updated_at ON public.store_settings;
CREATE TRIGGER store_settings_updated_at
  BEFORE UPDATE ON public.store_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.store_settings_set_updated_at();

-- Seed the singleton row.
INSERT INTO public.store_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;
