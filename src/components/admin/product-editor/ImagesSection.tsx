'use client';

/**
 * ImagesSection — primary image URL + secondary URL list.
 *
 * URL-input-first per the M3 ROADMAP risk note; ImageUploader (P4 T1)
 * will be backfilled in M4 polish. Previews use plain `<img>` rather than
 * `next/image` so arbitrary hosted URLs work without a remotePatterns
 * whitelist entry per image host.
 */

import { useFieldArray, type Control, type UseFormRegister, type FieldErrors } from 'react-hook-form';
import { Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { ProductFormValues } from './schema';

interface ImagesSectionProps {
  register: UseFormRegister<ProductFormValues>;
  control: Control<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
}

export function ImagesSection({ register, control, errors }: ImagesSectionProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'images' as never,
  });

  return (
    <div className="space-y-6">
      <Input
        label="Primary image URL"
        type="url"
        placeholder="https://…"
        error={errors.image?.message}
        {...register('image')}
      />

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
                    <Input
                      label={`Image ${idx + 1}`}
                      type="url"
                      placeholder="https://…"
                      error={typeof itemError === 'string' ? itemError : undefined}
                      {...register(`images.${idx}` as const)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    className="mt-7 inline-flex h-11 w-11 items-center justify-center rounded-sm border border-border-strong text-fg-muted transition-colors hover:bg-bg-alt hover:text-critical focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                    aria-label={`Remove image ${idx + 1}`}
                  >
                    <X className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                  </button>
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
      </div>
    </div>
  );
}
