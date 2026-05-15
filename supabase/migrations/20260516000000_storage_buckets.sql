-- ============================================================
-- Phase 4 Task 1: Supabase Storage buckets for admin image uploads
-- ============================================================
-- Buckets:
--   * blog-images    — consumed by BlogEditor (Phase 4 Task 2). The
--                      Tiptap editor inserts <img src=publicUrl> nodes
--                      after a successful upload via uploadImage().
--   * product-images — consumed by ProductEditor / ImageUploader for
--                      product hero + gallery uploads (M4 polish).
--
-- Both buckets are PUBLIC for read so anon shoppers can fetch the
-- returned publicUrl directly (no signed URL ceremony). Write access
-- is gated by `public.is_admin()` (defined in
-- 20260228_fix_rls_policies_and_is_admin.sql — returns TRUE for any
-- auth.uid() that appears in `public.admin_users`, OR for the
-- service_role key). Do NOT redefine is_admin() here.
--
-- Guardrails:
--   * file_size_limit     = 5 MiB (5_242_880 bytes) per object
--   * allowed_mime_types  = jpeg | png | webp | avif
--
-- Idempotent: all bucket inserts use ON CONFLICT (id) DO NOTHING and
-- all policies use DROP POLICY IF EXISTS before CREATE POLICY so this
-- migration is safe to re-run.
-- ============================================================

-- ---------- 1. Buckets ----------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-images',
  'blog-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ---------- 2. RLS policies on storage.objects ----------
-- storage.objects already has RLS enabled by Supabase; we only add
-- bucket-scoped policies.

-- blog-images: anon SELECT (public read)
DROP POLICY IF EXISTS "blog_images_anon_read" ON storage.objects;
CREATE POLICY "blog_images_anon_read"
  ON storage.objects
  FOR SELECT
  TO anon
  USING (bucket_id = 'blog-images');

-- blog-images: admin INSERT
DROP POLICY IF EXISTS "blog_images_admin_write" ON storage.objects;
CREATE POLICY "blog_images_admin_write"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'blog-images' AND public.is_admin());

-- blog-images: admin UPDATE
DROP POLICY IF EXISTS "blog_images_admin_update" ON storage.objects;
CREATE POLICY "blog_images_admin_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'blog-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'blog-images' AND public.is_admin());

-- blog-images: admin DELETE
DROP POLICY IF EXISTS "blog_images_admin_delete" ON storage.objects;
CREATE POLICY "blog_images_admin_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'blog-images' AND public.is_admin());

-- product-images: anon SELECT (public read)
DROP POLICY IF EXISTS "product_images_anon_read" ON storage.objects;
CREATE POLICY "product_images_anon_read"
  ON storage.objects
  FOR SELECT
  TO anon
  USING (bucket_id = 'product-images');

-- product-images: admin INSERT
DROP POLICY IF EXISTS "product_images_admin_write" ON storage.objects;
CREATE POLICY "product_images_admin_write"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

-- product-images: admin UPDATE
DROP POLICY IF EXISTS "product_images_admin_update" ON storage.objects;
CREATE POLICY "product_images_admin_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

-- product-images: admin DELETE
DROP POLICY IF EXISTS "product_images_admin_delete" ON storage.objects;
CREATE POLICY "product_images_admin_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin());
