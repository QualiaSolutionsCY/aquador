'use client';

/**
 * TagsSection — tag chip input.
 *
 * Operators type a tag and press Enter (or click "Add tag"). Each chip has
 * an inline × to remove. The form value is `string[]`; the chip array is
 * read from RHF via `watch` and writes back via `setValue` so the parent's
 * Zod schema validates the array shape on submit.
 */

import { useState, type KeyboardEvent } from 'react';
import type { Control, UseFormSetValue, UseFormWatch, FieldErrors } from 'react-hook-form';
import { useWatch } from 'react-hook-form';
import { Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { ProductFormValues } from './schema';

interface TagsSectionProps {
  control: Control<ProductFormValues>;
  setValue: UseFormSetValue<ProductFormValues>;
  watch: UseFormWatch<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
}

export function TagsSection({ control, setValue, errors }: TagsSectionProps) {
  const tags = useWatch({ control, name: 'tags' }) ?? [];
  const [draft, setDraft] = useState('');

  function addTag() {
    const next = draft.trim().toLowerCase();
    if (!next) return;
    if (tags.includes(next)) {
      setDraft('');
      return;
    }
    setValue('tags', [...tags, next], { shouldDirty: true, shouldValidate: true });
    setDraft('');
  }

  function removeTag(tag: string) {
    setValue(
      'tags',
      tags.filter((t) => t !== tag),
      { shouldDirty: true, shouldValidate: true },
    );
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  }

  const tagsError = typeof errors.tags?.message === 'string' ? errors.tags.message : undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Input
            label="Add tag"
            placeholder="e.g. oud, woody, oriental"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKey}
            error={tagsError}
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={addTag}
          leadingIcon={<Plus className="h-4 w-4" strokeWidth={1.5} />}
        >
          Add tag
        </Button>
      </div>

      {tags.length === 0 ? (
        <p className="font-body text-[13px] text-fg-muted">
          No tags yet. Tags surface in shop filters and the recommendation engine.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2" aria-label="Tags">
          {tags.map((tag) => (
            <li
              key={tag}
              className="inline-flex items-center gap-2 rounded-sm bg-bg-alt px-3 py-1.5 font-micro text-[12px] uppercase tracking-[0.05em] text-fg"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(tag)}
                aria-label={`Remove ${tag}`}
                className="inline-flex h-5 w-5 items-center justify-center rounded-sm text-fg-muted transition-colors hover:bg-bg hover:text-critical focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                <X className="h-3 w-3" strokeWidth={1.5} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
