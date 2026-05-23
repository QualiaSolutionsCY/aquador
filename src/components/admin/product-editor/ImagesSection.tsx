'use client';

/**
 * ImagesSection — primary image + secondary image list with upload, URL edit,
 * remove, set-primary, and reorder controls.
 */

import {
  useFieldArray,
  type Control,
  type UseFormRegister,
  type FieldErrors,
  type UseFormSetValue,
  type UseFormWatch,
} from 'react-hook-form';
import { ArrowDown, ArrowUp, ImageIcon, Plus, Star, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { deleteImage } from '@/lib/storage';
import type { ProductFormValues } from './schema';

interface ImagesSectionProps {
  register: UseFormRegister<ProductFormValues>;
  control: Control<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
  setValue: UseFormSetValue<ProductFormValues>;
  watch: UseFormWatch<ProductFormValues>;
  productId?: string;
}

function pathPrefix(productId?: string) {
  return `products/${productId ?? 'new'}`;
}

function storagePathFromPublicUrl(url: string): string | null {
  const marker = '/storage/v1/object/public/product-images/';
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length));
}

async function removeUploadedObject(url: string) {
  const path = storagePathFromPublicUrl(url);
  if (!path) return;
  await deleteImage({ bucket: 'product-images', path });
}

export function ImagesSection({ register, control, errors, setValue, watch, productId }: ImagesSectionProps) {
  const primaryImage = watch('image');
  const images = watch('images') ?? [];
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'images' as never,
  });

  function setAdditionalAsPrimary(index: number) {
    const nextPrimary = images[index];
    if (!nextPrimary) return;
    const nextImages = [...images];
    nextImages[index] = primaryImage;
    setValue('image', nextPrimary, { shouldDirty: true, shouldValidate: true });
    setValue('images', nextImages.filter(Boolean), { shouldDirty: true, shouldValidate: true });
  }

  function setPrimaryImage(url: string) {
    setValue('image', url, { shouldDirty: true, shouldValidate: true });
  }

  async function clearPrimaryImage() {
    const current = primaryImage;
    setValue('image', '', { shouldDirty: true, shouldValidate: true });
    if (current) await removeUploadedObject(current).catch(() => undefined);
  }

  async function removeAdditionalImage(index: number) {
    const current = images[index];
    remove(index);
    if (current) await removeUploadedObject(current).catch(() => undefined);
  }

  return (
    <div className="space-y-6">
      <Input
        label="Primary image URL"
        type="url"
        placeholder="https://…"
        error={errors.image?.message}
        {...register('image')}
      />

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
        <div className="min-h-[128px] rounded-sm border border-border bg-bg-alt p-3">
          {primaryImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={primaryImage}
              alt="Primary product preview"
              className="h-32 w-full rounded-sm object-cover"
            />
          ) : (
            <div className="flex h-32 items-center justify-center rounded-sm border border-dashed border-border-strong text-fg-muted">
              <ImageIcon className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
            </div>
          )}
        </div>
        <ImageUploader
          key={primaryImage || 'empty-primary-image'}
          bucket="product-images"
          pathPrefix={pathPrefix(productId)}
          initialPreviewUrl={primaryImage}
          onUploaded={(url) => setPrimaryImage(url)}
          onRemoved={() => setValue('image', '', { shouldDirty: true, shouldValidate: true })}
        />
      </div>

      {primaryImage ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => void clearPrimaryImage()}
          leadingIcon={<X className="h-4 w-4" strokeWidth={1.5} />}
        >
          Remove primary image
        </Button>
      ) : null}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-micro text-[12px] uppercase tracking-[0.05em] text-fg-muted">
            Additional images
          </span>
          <span className="font-micro text-[12px] text-fg-muted">{fields.length}/10</span>
        </div>

        {fields.length === 0 ? (
          <p className="font-body text-[13px] text-fg-muted">
            No additional images. Add a URL to show extra angles on the product page.
          </p>
        ) : (
          <ul className="space-y-3">
            {fields.map((field, idx) => {
              const itemError = errors.images?.[idx]?.message;
              return (
                <li key={field.id} className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="grid gap-3 md:grid-cols-[96px_minmax(0,1fr)]">
                      <div className="h-24 overflow-hidden rounded-sm border border-border bg-bg-alt">
                        {images[idx] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={images[idx]}
                            alt={`Product image ${idx + 1} preview`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-fg-muted">
                            <ImageIcon className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                          </div>
                        )}
                      </div>
                      <Input
                        label={`Image ${idx + 1}`}
                        type="url"
                        placeholder="https://…"
                        error={typeof itemError === 'string' ? itemError : undefined}
                        {...register(`images.${idx}` as const)}
                      />
                    </div>
                    <div className="mt-2">
                      <ImageUploader
                        key={images[idx] || field.id}
                        bucket="product-images"
                        pathPrefix={pathPrefix(productId)}
                        initialPreviewUrl={images[idx]}
                        onUploaded={(url) => setValue(`images.${idx}` as const, url, { shouldDirty: true, shouldValidate: true })}
                        onRemoved={() => setValue(`images.${idx}` as const, '', { shouldDirty: true, shouldValidate: true })}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void removeAdditionalImage(idx)}
                    className="mt-7 inline-flex h-11 w-11 items-center justify-center rounded-sm border border-border-strong text-fg-muted transition-colors hover:bg-bg-alt hover:text-critical focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                    aria-label={`Remove image ${idx + 1}`}
                  >
                    <X className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                  </button>
                  <div className="mt-7 flex gap-1">
                    <button
                      type="button"
                      onClick={() => move(idx, Math.max(0, idx - 1))}
                      disabled={idx === 0}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-sm border border-border-strong text-fg-muted transition-colors hover:bg-bg-alt hover:text-fg disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Move image ${idx + 1} up`}
                    >
                      <ArrowUp className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(idx, Math.min(fields.length - 1, idx + 1))}
                      disabled={idx === fields.length - 1}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-sm border border-border-strong text-fg-muted transition-colors hover:bg-bg-alt hover:text-fg disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Move image ${idx + 1} down`}
                    >
                      <ArrowDown className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdditionalAsPrimary(idx)}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-sm border border-border-strong text-fg-muted transition-colors hover:bg-bg-alt hover:text-accent-deep"
                      aria-label={`Set image ${idx + 1} as primary`}
                    >
                      <Star className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {fields.length < 10 ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => append('' as never)}
            leadingIcon={<Plus className="h-4 w-4" strokeWidth={1.5} />}
          >
            Add image URL
          </Button>
        ) : null}
        <p className="flex items-center gap-2 font-body text-[12px] text-fg-muted">
          <ImageIcon className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
          Each slot accepts an upload or a pasted URL. Use the star to make an image the storefront hero.
        </p>
      </div>
    </div>
  );
}
