'use client';

/**
 * ImageUploader — admin-only drag-and-drop / click-to-pick image upload
 * surface. Wraps `uploadImage()` from `@/lib/storage` and renders an
 * accessible drop zone, a thumbnail preview, an indeterminate progress
 * bar during the upload, and an inline error message on failure.
 *
 * Consumed by BlogEditor (Phase 4 Task 2) via a toolbar button that
 * mounts this component, listens for `onUploaded`, and inserts the
 * returned publicUrl into the Tiptap document.
 *
 * Voice: admin-direct functional copy. §10b storefront copy rules do
 * NOT apply on admin tools.
 *
 * Tokens used (no hardcoded hex, no display-font family, no gold class):
 *   surface       var(--bg-alt)
 *   border        var(--border-strong)
 *   accent        var(--accent)
 *   error         var(--critical)
 *   shadow        var(--shadow-1)
 *   radius        var(--radius-sm)
 *   spacing       var(--space-3) / var(--space-4)
 *   micro label   var(--font-micro-family)
 */

import { useCallback, useId, useRef, useState, type DragEvent, type ChangeEvent } from 'react';
import Image from 'next/image';
import {
  uploadImage,
  StorageError,
  ACCEPTED_IMAGE_MIME,
  type StorageBucket,
} from '@/lib/storage';

const DEFAULT_ACCEPT = ACCEPTED_IMAGE_MIME.join(',');

const ERROR_COPY: Record<string, string> = {
  'too-large': 'File is over 25 MB. Pick a smaller image.',
  'wrong-type': 'Only JPEG, PNG, WebP, or AVIF.',
  'upload-failed': 'Upload failed. Try again.',
  'unauthenticated': 'Your session expired. Sign back in.',
};

export interface ImageUploaderProps {
  bucket: StorageBucket;
  pathPrefix: string;
  onUploaded: (publicUrl: string, path: string) => void;
  onRemoved?: () => void;
  /** Optional override for the file input `accept` attribute. */
  accept?: string;
  /** Optional starting preview URL (e.g. existing image being replaced). */
  initialPreviewUrl?: string;
  className?: string;
}

export function ImageUploader({
  bucket,
  pathPrefix,
  onUploaded,
  onRemoved,
  accept,
  initialPreviewUrl,
  className,
}: ImageUploaderProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPreviewUrl ?? null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);
      try {
        const result = await uploadImage({ bucket, file, pathPrefix });
        setPreviewUrl(result.publicUrl);
        onUploaded(result.publicUrl, result.path);
      } catch (err) {
        if (err instanceof StorageError) {
          setError(ERROR_COPY[err.code] ?? 'Upload failed. Try again.');
        } else {
          setError('Upload failed. Try again.');
        }
      } finally {
        setUploading(false);
      }
    },
    [bucket, pathPrefix, onUploaded]
  );

  const onInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        void handleFile(file);
      }
      // Reset so the same filename can be re-picked.
      event.target.value = '';
    },
    [handleFile]
  );

  const onDrop = useCallback(
    (event: DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragOver(false);
      const file = event.dataTransfer?.files?.[0];
      if (file) {
        void handleFile(file);
      }
    },
    [handleFile]
  );

  const onDragOver = useCallback((event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback((event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  }, []);

  const clearPreview = useCallback(() => {
    setPreviewUrl(null);
    setError(null);
    onRemoved?.();
    inputRef.current?.focus();
  }, [onRemoved]);

  const borderColor = error
    ? 'var(--critical)'
    : isDragOver
      ? 'var(--accent)'
      : 'var(--border-strong)';

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept ?? DEFAULT_ACCEPT}
        onChange={onInputChange}
        disabled={uploading}
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      />

      <label
        htmlFor={inputId}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        aria-disabled={uploading}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-3)',
          minHeight: 144,
          padding: 'var(--space-4)',
          background: 'var(--bg-alt)',
          border: `1px solid ${borderColor}`,
          borderRadius: 'var(--radius-sm, 4px)',
          cursor: uploading ? 'progress' : 'pointer',
          transition: 'border-color 120ms ease, box-shadow 120ms ease',
          boxShadow: isDragOver ? 'var(--shadow-1)' : 'none',
          textAlign: 'center',
        }}
      >
        {previewUrl ? (
          <div
            style={{
              position: 'relative',
              width: 96,
              height: 96,
              borderRadius: 'var(--radius-sm, 4px)',
              border: '1px solid var(--border-strong)',
              overflow: 'hidden',
            }}
          >
            <Image
              src={previewUrl}
              alt="Uploaded preview"
              fill
              sizes="96px"
              unoptimized
              style={{ objectFit: 'cover' }}
            />
          </div>
        ) : null}

        <span
          style={{
            fontFamily: 'var(--font-micro-family)',
            fontSize: 12,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: 'var(--fg, currentColor)',
          }}
        >
          {uploading
            ? 'Uploading…'
            : previewUrl
              ? 'Replace image'
              : 'Drop an image, or click to choose.'}
        </span>

        <span
          style={{
            fontFamily: 'var(--font-micro-family)',
            fontSize: 11,
            letterSpacing: '0.04em',
            opacity: 0.7,
          }}
        >
          JPEG, PNG, WebP, AVIF · 25 MB max
        </span>

        {uploading ? (
          <span
            aria-hidden="true"
            style={{
              display: 'block',
              width: '60%',
              height: 2,
              background: 'var(--accent)',
              borderRadius: 2,
              opacity: 0.85,
              animation: 'pulse 1.2s ease-in-out infinite',
            }}
          />
        ) : null}
      </label>

      {previewUrl && !uploading ? (
        <button
          type="button"
          onClick={clearPreview}
          style={{
            alignSelf: 'flex-start',
            padding: 'var(--space-3) var(--space-4)',
            background: 'transparent',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-sm, 4px)',
            fontFamily: 'var(--font-micro-family)',
            fontSize: 12,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          Remove image
        </button>
      ) : null}

      {error ? (
        <p
          role="alert"
          style={{
            margin: 0,
            color: 'var(--critical)',
            fontFamily: 'var(--font-micro-family)',
            fontSize: 12,
            letterSpacing: '0.04em',
          }}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default ImageUploader;
