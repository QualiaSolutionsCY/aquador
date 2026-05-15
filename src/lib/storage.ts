/**
 * Supabase Storage wrapper for admin image uploads.
 *
 * Buckets are provisioned by
 * `supabase/migrations/20260516000000_storage_buckets.sql` with public
 * read + admin-only write enforced by `public.is_admin()` on
 * `storage.objects`. This module is the ONLY place bucket names appear
 * in TypeScript code so a future rename costs one line.
 *
 * Consumed by:
 *   - `src/components/admin/ImageUploader.tsx` (drag-and-drop primitive)
 *   - `src/components/admin/BlogEditor.tsx` (Phase 4 Task 2 — inserts
 *     returned publicUrl into Tiptap as <img>)
 *   - future ProductEditor (M4 polish)
 *
 * Uses the browser Supabase client (`@/lib/supabase/client`) — the
 * caller's session cookie carries the admin identity and RLS evaluates
 * `public.is_admin()` server-side. NEVER import the service-role admin
 * client here; that key must not reach the browser.
 */

import { createClient } from '@/lib/supabase/client';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const ACCEPTED_IMAGE_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const;

export type AcceptedImageMime = (typeof ACCEPTED_IMAGE_MIME)[number];

export type StorageBucket = 'blog-images' | 'product-images';

export type StorageErrorCode =
  | 'too-large'
  | 'wrong-type'
  | 'upload-failed'
  | 'unauthenticated';

export class StorageError extends Error {
  public readonly code: StorageErrorCode;
  constructor(code: StorageErrorCode, message: string) {
    super(message);
    this.name = 'StorageError';
    this.code = code;
  }
}

function randomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback — should never hit in modern browsers but keeps SSR safe.
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function normalisePrefix(prefix: string): string {
  return prefix.replace(/^\/+|\/+$/g, '');
}

function extensionFor(file: File): string {
  const dot = file.name.lastIndexOf('.');
  if (dot === -1) return 'bin';
  return file.name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
}

export interface UploadImageArgs {
  bucket: StorageBucket;
  file: File;
  /** Path segment under the bucket, e.g. `'posts/2026-05'`. Leading/
   * trailing slashes are stripped. A random UUID filename is appended. */
  pathPrefix: string;
}

export interface UploadImageResult {
  publicUrl: string;
  path: string;
}

export async function uploadImage({
  bucket,
  file,
  pathPrefix,
}: UploadImageArgs): Promise<UploadImageResult> {
  if (file.size > MAX_IMAGE_BYTES) {
    throw new StorageError(
      'too-large',
      `File exceeds ${MAX_IMAGE_BYTES} bytes (${file.size} bytes)`
    );
  }

  if (!ACCEPTED_IMAGE_MIME.includes(file.type as AcceptedImageMime)) {
    throw new StorageError(
      'wrong-type',
      `Unsupported MIME type: ${file.type || 'unknown'}`
    );
  }

  const supabase = createClient();
  const prefix = normalisePrefix(pathPrefix);
  const filename = `${randomId()}.${extensionFor(file)}`;
  const path = prefix ? `${prefix}/${filename}` : filename;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
      cacheControl: '3600',
    });

  if (uploadError) {
    const message = uploadError.message ?? 'Unknown upload error';
    // Supabase returns a 401/403-shaped message when RLS denies the
    // write. Map it to a discrete code so the UI can prompt re-login.
    if (/jwt|auth|unauthor|denied|policy/i.test(message)) {
      throw new StorageError('unauthenticated', message);
    }
    throw new StorageError('upload-failed', message);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { publicUrl: data.publicUrl, path };
}

export interface DeleteImageArgs {
  bucket: StorageBucket;
  path: string;
}

export async function deleteImage({
  bucket,
  path,
}: DeleteImageArgs): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    const message = error.message ?? 'Unknown delete error';
    if (/jwt|auth|unauthor|denied|policy/i.test(message)) {
      throw new StorageError('unauthenticated', message);
    }
    throw new StorageError('upload-failed', message);
  }
}
