'use client';

/**
 * DescriptionSection — single Textarea for product description.
 *
 * Rich text editor (Tiptap) is scoped to Phase 4 / Blog editor; products
 * keep plain Textarea for M3.
 */

import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Textarea } from '@/components/ui/Textarea';
import type { ProductFormValues } from './schema';

interface DescriptionSectionProps {
  register: UseFormRegister<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
}

export function DescriptionSection({ register, errors }: DescriptionSectionProps) {
  return (
    <Textarea
      label="Description"
      rows={6}
      placeholder="Describe the fragrance — notes, occasion, longevity."
      error={errors.description?.message}
      {...register('description')}
    />
  );
}
