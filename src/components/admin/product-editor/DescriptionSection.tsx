'use client';

/**
 * DescriptionSection — Tiptap rich-text editor for product descriptions.
 *
 * Toolbar mirrors BlogEditor: bold / italic / underline / H2 / H3 /
 * bulleted list / numbered list / horizontal rule. Output is HTML, persisted
 * via react-hook-form's Controller. Sanitized in serialize.ts on save and
 * rendered as sanitized HTML on the PDP (see product-description.ts).
 */

import { useEffect, useMemo, useState } from 'react';
import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProductFormValues } from './schema';

interface DescriptionSectionProps {
  control: Control<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
}

export function DescriptionSection({ control, errors }: DescriptionSectionProps) {
  return (
    <Controller
      control={control}
      name="description"
      render={({ field }) => (
        <RichDescription
          value={field.value ?? ''}
          onChange={field.onChange}
          error={errors.description?.message}
        />
      )}
    />
  );
}

interface RichDescriptionProps {
  value: string;
  onChange: (html: string) => void;
  error?: string;
}

function RichDescription({ value, onChange, error }: RichDescriptionProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
    ],
    content: value || '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          'min-h-[220px] px-4 py-3 focus:outline-none',
          'prose prose-sm max-w-none',
          'prose-headings:font-display prose-headings:text-fg',
          'prose-p:text-fg prose-strong:text-fg',
          'prose-a:text-accent prose-blockquote:text-fg-muted',
        ),
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  // Re-sync editor when the form value changes externally (e.g. reset).
  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) {
    return (
      <div className="min-h-[260px] rounded-sm border border-border bg-bg-alt" aria-busy="true" />
    );
  }

  return (
    <div className="space-y-1.5">
      <label className="font-micro text-[11px] uppercase tracking-[0.08em] text-fg-muted">
        Description
      </label>
      <div className="rounded-sm border border-border-strong bg-bg overflow-hidden">
        <EditorToolbar editor={editor} />
        <EditorContent editor={editor} />
      </div>
      {error ? (
        <p className="font-body text-[12px] text-critical">{error}</p>
      ) : (
        <p className="font-body text-[12px] text-fg-muted">
          Bold, italic, headings, and lists are supported. Formatting renders on the product page.
        </p>
      )}
    </div>
  );
}

interface EditorToolbarProps {
  editor: Editor;
}

function EditorToolbar({ editor }: EditorToolbarProps) {
  // Force re-renders so toolbar active states stay in sync with selection.
  const [, forceRender] = useState(0);
  useEffect(() => {
    const tick = () => forceRender((n) => n + 1);
    editor.on('transaction', tick);
    editor.on('selectionUpdate', tick);
    return () => {
      editor.off('transaction', tick);
      editor.off('selectionUpdate', tick);
    };
  }, [editor]);

  const buttons = useMemo(
    () => [
      {
        key: 'bold',
        icon: Bold,
        label: 'Bold',
        active: editor.isActive('bold'),
        onClick: () => editor.chain().focus().toggleBold().run(),
      },
      {
        key: 'italic',
        icon: Italic,
        label: 'Italic',
        active: editor.isActive('italic'),
        onClick: () => editor.chain().focus().toggleItalic().run(),
      },
      {
        key: 'underline',
        icon: UnderlineIcon,
        label: 'Underline',
        active: editor.isActive('underline'),
        onClick: () => editor.chain().focus().toggleUnderline().run(),
      },
      {
        key: 'h2',
        icon: Heading2,
        label: 'Heading 2',
        active: editor.isActive('heading', { level: 2 }),
        onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      },
      {
        key: 'h3',
        icon: Heading3,
        label: 'Heading 3',
        active: editor.isActive('heading', { level: 3 }),
        onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      },
      {
        key: 'ul',
        icon: List,
        label: 'Bulleted list',
        active: editor.isActive('bulletList'),
        onClick: () => editor.chain().focus().toggleBulletList().run(),
      },
      {
        key: 'ol',
        icon: ListOrdered,
        label: 'Numbered list',
        active: editor.isActive('orderedList'),
        onClick: () => editor.chain().focus().toggleOrderedList().run(),
      },
      {
        key: 'hr',
        icon: Minus,
        label: 'Horizontal rule',
        active: false,
        onClick: () => editor.chain().focus().setHorizontalRule().run(),
      },
    ],
    [editor],
  );

  return (
    <div className="flex flex-wrap items-center gap-1 px-2 py-2 bg-bg-alt border-b border-border">
      {buttons.map(({ key, icon: Icon, label, active, onClick }) => (
        <button
          key={key}
          type="button"
          onClick={onClick}
          title={label}
          aria-label={label}
          aria-pressed={active}
          className={cn(
            'inline-flex h-8 w-8 items-center justify-center rounded-sm',
            'transition-colors duration-150 ease-[cubic-bezier(0.25,1,0.5,1)]',
            'outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-alt',
            active
              ? 'bg-accent/15 text-accent-deep'
              : 'text-fg-muted hover:text-fg hover:bg-bg',
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={1.5} />
        </button>
      ))}
    </div>
  );
}
