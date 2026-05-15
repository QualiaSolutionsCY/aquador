'use client';

/**
 * VisibilitySection — is_active toggle + featured toggle.
 *
 * Note: the `products` table has no `featured` column; "featured" is a
 * marketing concern surfaced through the `tags` array (the storefront
 * looks for `tags includes 'featured'`). This section therefore mirrors
 * the boolean into `tags` on save — handled by the parent's submit
 * adapter, not here.
 */

import type { Control } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Switch } from '@/components/ui/Switch';
import type { ProductFormValues } from './schema';

interface VisibilitySectionProps {
  control: Control<ProductFormValues>;
}

const labelClass = 'font-micro text-[12px] uppercase tracking-[0.05em] text-fg';
const helpClass = 'mt-1 font-body text-[13px] text-fg-muted';

export function VisibilitySection({ control }: VisibilitySectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className={labelClass}>Mark active</span>
          <p className={helpClass}>
            When off, the product is hidden from the storefront and category pages.
          </p>
        </div>
        <Controller
          control={control}
          name="is_active"
          render={({ field }) => (
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
              aria-label="Mark active"
            />
          )}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <span className={labelClass}>Featured</span>
          <p className={helpClass}>
            Surfaces on the homepage carousel. Writes a &lsquo;featured&rsquo; entry into tags.
          </p>
        </div>
        <Controller
          control={control}
          name="featured"
          render={({ field }) => (
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
              aria-label="Featured"
            />
          )}
        />
      </div>
    </div>
  );
}
