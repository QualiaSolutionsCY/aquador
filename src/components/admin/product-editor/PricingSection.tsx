'use client';

/**
 * PricingSection — price (EUR), sale price (optional), in_stock switch.
 *
 * Numeric inputs use `valueAsNumber` so react-hook-form delivers actual
 * numbers to Zod (avoids string-vs-number validation issues).
 */

import type { Control, UseFormRegister, FieldErrors } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import type { ProductFormValues } from './schema';

interface PricingSectionProps {
  register: UseFormRegister<ProductFormValues>;
  control: Control<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
}

const labelClass = 'font-micro text-[12px] uppercase tracking-[0.05em] text-fg-muted';

export function PricingSection({ register, control, errors }: PricingSectionProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <Input
        label="Price (EUR)"
        type="number"
        step="0.01"
        min="0"
        placeholder="29.99"
        error={errors.price?.message}
        {...register('price', { valueAsNumber: true })}
      />

      <Input
        label="Sale price (EUR, optional)"
        type="number"
        step="0.01"
        min="0"
        placeholder="Leave empty for none"
        error={
          typeof errors.sale_price?.message === 'string' ? errors.sale_price.message : undefined
        }
        {...register('sale_price', {
          setValueAs: (v) => (v === '' || v === null || v === undefined ? '' : Number(v)),
        })}
      />

      <div className="flex items-center justify-between gap-4 md:col-span-2">
        <div>
          <span className={labelClass}>In stock</span>
          <p className="mt-1 font-body text-[13px] text-fg-muted">
            Storefront hides the buy button when off.
          </p>
        </div>
        <Controller
          control={control}
          name="in_stock"
          render={({ field }) => (
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
              aria-label="In stock"
            />
          )}
        />
      </div>
    </div>
  );
}
