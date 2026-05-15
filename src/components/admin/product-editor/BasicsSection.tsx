'use client';

/**
 * BasicsSection — name, brand, category, gender, product_type, size.
 *
 * Fields write to react-hook-form via `register` + Controller. Admin-direct
 * register: terse labels, no marketing copy.
 */

import type { Control, UseFormRegister, FieldErrors } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Input } from '@/components/ui/Input';
import {
  SelectRoot,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  PRODUCT_CATEGORIES,
  PRODUCT_TYPES,
  PRODUCT_GENDERS,
  PRODUCT_SIZES,
  type ProductFormValues,
} from './schema';

interface BasicsSectionProps {
  register: UseFormRegister<ProductFormValues>;
  control: Control<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
}

const labelClass = 'font-micro text-[12px] uppercase tracking-[0.05em] text-fg-muted';

type SelectFieldProps = {
  name: 'category' | 'product_type' | 'gender' | 'size';
  label: string;
  control: Control<ProductFormValues>;
  options: readonly { value: string; label: string }[];
  error?: string;
  placeholder?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
};

function SelectField({
  name,
  label,
  control,
  options,
  error,
  placeholder,
  allowEmpty,
  emptyLabel,
}: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className={labelClass}>{label}</span>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <SelectRoot
            value={field.value === '' ? '__none' : (field.value as string)}
            onValueChange={(v: string) => field.onChange(v === '__none' ? '' : v)}
          >
            <SelectTrigger aria-invalid={error ? 'true' : undefined}>
              <SelectValue placeholder={placeholder ?? 'Select'} />
            </SelectTrigger>
            <SelectContent>
              {allowEmpty ? (
                <SelectItem value="__none">{emptyLabel ?? 'Not specified'}</SelectItem>
              ) : null}
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </SelectRoot>
        )}
      />
      {error ? <p className="font-micro text-[12px] text-critical">{error}</p> : null}
    </div>
  );
}

export function BasicsSection({ register, control, errors }: BasicsSectionProps) {
  const sizeOptions = PRODUCT_SIZES.map((s) => ({ value: s, label: s }));
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="md:col-span-2">
        <Input
          label="Name"
          placeholder="e.g. Oud Ispahan"
          error={errors.name?.message}
          {...register('name')}
        />
      </div>

      <Input
        label="Brand"
        placeholder="e.g. Lattafa, Dior, Aquad'or"
        error={errors.brand?.message}
        {...register('brand')}
      />

      <SelectField
        name="category"
        label="Category"
        control={control}
        options={PRODUCT_CATEGORIES}
        error={errors.category?.message}
        placeholder="Select category"
      />

      <SelectField
        name="product_type"
        label="Product type"
        control={control}
        options={PRODUCT_TYPES}
        error={errors.product_type?.message}
        placeholder="Select type"
      />

      <SelectField
        name="gender"
        label="Gender"
        control={control}
        options={PRODUCT_GENDERS}
        allowEmpty
        emptyLabel="Not specified"
      />

      <SelectField
        name="size"
        label="Size"
        control={control}
        options={sizeOptions}
        error={errors.size?.message}
        placeholder="Select size"
      />
    </div>
  );
}
