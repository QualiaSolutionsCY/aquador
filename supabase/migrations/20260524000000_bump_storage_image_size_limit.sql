-- Raise per-object size limit on the admin image buckets from 5 MiB to
-- 25 MiB so operators can upload higher-resolution product / blog photos
-- straight from camera output. Mirrors src/lib/storage.ts.
--
-- 26214400 bytes = 25 * 1024 * 1024.

UPDATE storage.buckets
   SET file_size_limit = 26214400
 WHERE id IN ('blog-images', 'product-images');
