'use client';

/**
 * ProductEditor — top-level sectioned form replacing the 568-LOC
 * `ProductForm.tsx` monolith.
 *
 * Hairline-divider stack (NO Card wrapper, NO Tabs — admin tools favour
 * functional density). Submits to `/api/admin/products` which delegates
 * to admin-service.ts. react-hook-form + Zod inline validation. Toast on
 * save/error. Serialization lives in `./product-editor/serialize.ts`.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import type { Product } from '@/lib/supabase/types';
import { BasicsSection } from './product-editor/BasicsSection';
import { PricingSection } from './product-editor/PricingSection';
import { DescriptionSection } from './product-editor/DescriptionSection';
import { ImagesSection } from './product-editor/ImagesSection';
import { TagsSection } from './product-editor/TagsSection';
import { VisibilitySection } from './product-editor/VisibilitySection';
import { EditorSection } from './product-editor/EditorSection';
import { productFormSchema, type ProductFormValues } from './product-editor/schema';
import { buildDefaults, toPayload } from './product-editor/serialize';

interface ProductEditorProps {
  product: Product | null;
  mode: 'create' | 'edit';
}

export default function ProductEditor({ product, mode }: ProductEditorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: buildDefaults(product),
  });
  const { register, control, handleSubmit, formState, setValue, watch } = form;
  const errors = formState.errors;

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/products', {
          method: mode === 'create' ? 'POST' : 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(toPayload(values, product?.id)),
        });
        const json = await res.json();
        if (!res.ok) {
          toast({ title: 'Save failed', description: json.error ?? 'Unknown error', variant: 'error' });
          return;
        }
        toast({ title: 'Product saved', variant: 'success' });
        if (mode === 'create' && json.product?.id) router.push(`/admin/products/${json.product.id}`);
        else router.refresh();
      } catch (err) {
        toast({
          title: 'Save failed',
          description: err instanceof Error ? err.message : 'Network error',
          variant: 'error',
        });
      }
    });
  });

  async function onDelete() {
    if (!product) return;
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products?id=${encodeURIComponent(product.id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        toast({ title: 'Delete failed', description: json.error ?? 'Unknown error', variant: 'error' });
        setDeleting(false);
        return;
      }
      toast({ title: 'Product deleted', variant: 'success' });
      router.push('/admin/products');
      router.refresh();
    } catch (err) {
      toast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Network error',
        variant: 'error',
      });
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <header className="flex items-center gap-3">
        <Link
          href="/admin/products"
          aria-label="Back to products"
          className="inline-flex h-9 w-9 items-center justify-center rounded-sm text-fg-muted transition-colors hover:bg-bg-alt hover:text-fg"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
        </Link>
        <div>
          <h1 className="font-display text-[28px] leading-tight text-fg">
            {mode === 'create' ? 'New product' : 'Edit product'}
          </h1>
          <p className="font-body text-[13px] text-fg-muted">
            {mode === 'create' ? 'Add a product to the catalogue.' : product?.name}
          </p>
        </div>
      </header>

      <EditorSection title="Basics" caption="Identity and shelf placement.">
        <BasicsSection register={register} control={control} errors={errors} />
      </EditorSection>
      <EditorSection title="Pricing" caption="Per-unit pricing. Sale price overrides on the storefront when set.">
        <PricingSection register={register} control={control} errors={errors} />
      </EditorSection>
      <EditorSection title="Description" caption="Plain text. Rich formatting lands with the blog editor.">
        <DescriptionSection register={register} errors={errors} />
      </EditorSection>
      <EditorSection title="Images" caption="Paste hosted image URLs. Drag-and-drop upload arrives in M4.">
        <ImagesSection register={register} control={control} errors={errors} />
      </EditorSection>
      <EditorSection title="Tags" caption="Surfaced in shop filters and the recommendation engine.">
        <TagsSection control={control} setValue={setValue} watch={watch} errors={errors} />
      </EditorSection>
      <EditorSection title="Visibility" caption="Hide from storefront or promote to homepage.">
        <VisibilitySection control={control} />
      </EditorSection>

      <div className="sticky bottom-0 -mx-4 flex items-center justify-between gap-3 border-t border-border bg-bg/95 px-4 py-4 backdrop-blur md:-mx-6 md:px-6">
        {mode === 'edit' && product ? (
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onDelete}
            disabled={deleting || isPending}
            leadingIcon={<Trash2 className="h-4 w-4" strokeWidth={1.5} />}
          >
            Delete product
          </Button>
        ) : <span />}
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => router.push('/admin/products')}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" isLoading={isPending}>
            Save changes
          </Button>
        </div>
      </div>
    </form>
  );
}
