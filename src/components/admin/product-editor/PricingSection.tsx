'use client';

/**
 * PricingSection — price (EUR), sale price (optional), stock quantity.
 *
 * Numeric inputs use `valueAsNumber` so react-hook-form delivers actual
 * numbers to Zod (avoids string-vs-number validation issues).
 *
 * Stock is a manual integer count. The `in_stock` availability flag is
 * derived from it at serialization time (in_stock = stock_quantity > 0) —
 * there is no separate toggle.
 */

import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Input } from '@/components/ui/Input';
import type { ProductFormValues } from './schema';

interface PricingSectionProps {
  register: UseFormRegister<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
}

export function PricingSection({ register, errors }: PricingSectionProps) {
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

      <div className="md:col-span-2">
        <Input
          label="Stock quantity"
          type="number"
          step="1"
          min="0"
          placeholder="0"
          error={errors.stock_quantity?.message}
          {...register('stock_quantity', { valueAsNumber: true })}
        />
        <p className="mt-1 font-body text-[13px] text-fg-muted">
          0 = out of stock. Storefront shows &ldquo;Only X left&rdquo; at 5 or fewer.
        </p>
      </div>
    </div>
  );
}
