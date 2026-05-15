'use client';

/**
 * BlogEditor — Tiptap-based admin blog editor with autosave + Supabase
 * Storage image upload (Phase 4 Task 2).
 *
 * Replaces the legacy thin rich-text wrapper. Owns its own
 * title / slug / cover / body / status state; autosaves the body on a
 * 15-second debounce after the last keystroke; flushes the debounce on
 * manual save; race-guarded against double-fires via `lastPersistedRef`.
 *
 * Modes:
 *   * `create` — no post yet. Renders a thin form that POSTs to
 *     `/api/blog` and navigates to `/admin/blog/[slug]/edit` once the
 *     row exists. Autosave is intentionally OFF here; an autosave with
 *     no row to update would 404 every 15 seconds.
 *   * `edit`   — full editor with autosave on the existing slug, image
 *     upload toolbar button, cover-image uploader, status toggle.
 *
 * Voice: admin-direct functional copy (DESIGN §10b storefront copy bans
 * do NOT apply on admin tooling — em-dashes, plain labels, etc. are OK).
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Minus,
  ImagePlus,
  Save,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { ImageUploader } from './ImageUploader';
import { useToast } from '@/components/ui/Toast';
import { generateSlug, estimateReadTime } from '@/lib/blog-types';
import type { BlogPost } from '@/lib/blog-types';
import { cn } from '@/lib/utils';

const AUTOSAVE_MS = 15_000;

type SaveState = 'idle' | 'editing' | 'saving' | 'saved' | 'error';

interface BlogEditorProps {
  post?: BlogPost;
  mode: 'create' | 'edit';
}

const SAVE_PILL: Record<SaveState, { label: string; variant: BadgeVariant }> = {
  idle: { label: 'Ready', variant: 'neutral' },
  editing: { label: 'Editing', variant: 'neutral' },
  saving: { label: 'Saving', variant: 'accent' },
  saved: { label: 'Saved draft', variant: 'success' },
  error: { label: 'Save failed - retry', variant: 'critical' },
};

export function BlogEditor({ post, mode }: BlogEditorProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Core fields
  const [title, setTitle] = useState(post?.title ?? '');
  const [slug, setSlug] = useState(post?.slug ?? '');
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? '');
  const [coverImage, setCoverImage] = useState(post?.cover_image ?? '');
  const [category, setCategory] = useState(post?.category ?? '');
  const [status, setStatus] = useState<'draft' | 'published'>(
    (post?.status as 'draft' | 'published') ?? 'draft',
  );
  const [featured, setFeatured] = useState<boolean>(post?.featured ?? false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(Boolean(post));

  // Save state
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [creating, setCreating] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const lastPersistedRef = useRef<string>(post?.content ?? '');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Latest meta sidecars so a fire-and-forget autosave never sends stale
  // title/status/etc. from a closure captured at editor mount.
  const latestMetaRef = useRef({
    title,
    slug: post?.slug ?? slug,
    excerpt,
    coverImage,
    category,
    status,
    featured,
  });
  useEffect(() => {
    latestMetaRef.current = {
      title,
      slug: post?.slug ?? slug,
      excerpt,
      coverImage,
      category,
      status,
      featured,
    };
  }, [title, slug, excerpt, coverImage, category, status, featured, post?.slug]);

  // Auto-generate slug from title while it hasn't been manually edited.
  useEffect(() => {
    if (!slugManuallyEdited && title) {
      setSlug(generateSlug(title));
    }
  }, [title, slugManuallyEdited]);

  const persist = useCallback(
    async (html: string, reason: 'autosave' | 'manual') => {
      // Race-guard: skip an autosave that wouldn't change anything on disk.
      if (reason === 'autosave' && html === lastPersistedRef.current) {
        return;
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (mode !== 'edit' || !post?.slug) {
        // Defensive — autosave should not be called pre-create.
        return;
      }
      setSaveState('saving');
      try {
        const meta = latestMetaRef.current;
        const payload: Record<string, unknown> = {
          title: meta.title,
          content: html,
          excerpt: meta.excerpt || undefined,
          cover_image: meta.coverImage || null,
          category: meta.category || undefined,
          status: reason === 'autosave' ? 'draft' : meta.status,
          featured: meta.featured,
        };
        const res = await fetch(`/api/blog/${post.slug}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errBody = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(errBody.error ?? `HTTP ${res.status}`);
        }
        lastPersistedRef.current = html;
        setSaveState('saved');
        if (reason === 'manual') {
          toast({
            title: 'Saved',
            description: `Read time ~${estimateReadTime(html)} min.`,
            variant: 'success',
          });
        }
      } catch (err) {
        setSaveState('error');
        toast({
          title: 'Save failed',
          description: err instanceof Error ? err.message : 'Unknown error',
          variant: 'error',
        });
      }
    },
    [mode, post, toast],
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      Image.configure({ inline: false, allowBase64: false }),
    ],
    content: post?.content ?? '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          'min-h-[400px] px-4 py-3 focus:outline-none',
          'prose prose-sm max-w-none',
          'prose-headings:font-display prose-headings:text-fg',
          'prose-p:text-fg prose-strong:text-fg',
          'prose-a:text-accent prose-blockquote:text-fg-muted',
          'prose-img:rounded-sm prose-img:border prose-img:border-border',
        ),
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (mode !== 'edit') return;
      setSaveState('editing');
      if (timerRef.current) clearTimeout(timerRef.current);
      const html = ed.getHTML();
      timerRef.current = setTimeout(() => {
        void persist(html, 'autosave');
      }, AUTOSAVE_MS);
    },
  });

  // Clear timer on unmount.
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const handleManualSave = useCallback(() => {
    if (!editor) return;
    void persist(editor.getHTML(), 'manual');
  }, [editor, persist]);

  // CREATE MODE — thin form, no editor body, no autosave.
  const handleCreate = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!title.trim()) {
        toast({ title: 'Title required', variant: 'error' });
        return;
      }
      setCreating(true);
      try {
        const generatedSlug = slug || generateSlug(title);
        const res = await fetch('/api/blog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            slug: generatedSlug,
            content: '<p></p>',
            status: 'draft',
            ...(excerpt ? { excerpt } : {}),
            ...(coverImage ? { cover_image: coverImage } : {}),
            ...(category ? { category } : {}),
          }),
        });
        if (!res.ok) {
          const errBody = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(errBody.error ?? `HTTP ${res.status}`);
        }
        const created = (await res.json()) as { slug: string };
        toast({ title: 'Draft created', variant: 'success' });
        router.push(`/admin/blog/${created.slug}/edit`);
      } catch (err) {
        toast({
          title: 'Create failed',
          description: err instanceof Error ? err.message : 'Unknown error',
          variant: 'error',
        });
        setCreating(false);
      }
    },
    [title, slug, excerpt, coverImage, category, router, toast],
  );

  const pill = SAVE_PILL[saveState];

  if (mode === 'create') {
    return (
      <form onSubmit={handleCreate} className="space-y-6 max-w-2xl">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="A short, scannable title"
        />
        <Input
          label="Slug"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugManuallyEdited(true);
          }}
          hint="Auto-generated from title. Edit to override."
          placeholder="my-new-post"
        />
        <Textarea
          label="Excerpt"
          value={excerpt ?? ''}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={3}
          hint="Optional — used in listings and SEO descriptions."
        />
        <Input
          label="Category"
          value={category ?? ''}
          onChange={(e) => setCategory(e.target.value)}
          hint="Optional — taxonomy bucket."
        />
        <div className="flex flex-col gap-2">
          <span className="font-micro text-[12px] uppercase tracking-[0.05em] text-fg-muted">
            Cover image
          </span>
          <ImageUploader
            bucket="blog-images"
            pathPrefix="covers/draft"
            onUploaded={(url) => setCoverImage(url)}
            initialPreviewUrl={coverImage || undefined}
          />
        </div>
        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" isLoading={creating} disabled={creating}>
            Create draft
          </Button>
          <span className="font-micro text-[12px] text-fg-muted">
            After creating, the editor opens with autosave on.
          </span>
        </div>
      </form>
    );
  }

  // EDIT MODE — full editor, autosave on.
  if (!editor) {
    return (
      <div className="flex items-center gap-2 text-fg-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="font-micro text-[12px] uppercase tracking-[0.05em]">
          Loading editor
        </span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      {/* Main column — editor */}
      <div className="space-y-4 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Badge variant={pill.variant}>{pill.label}</Badge>
            <span className="font-micro text-[11px] uppercase tracking-[0.05em] text-fg-muted">
              Autosave every 15s
            </span>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleManualSave}
            isLoading={saveState === 'saving'}
            leadingIcon={<Save className="h-4 w-4" strokeWidth={1.5} />}
          >
            Save now
          </Button>
        </div>

        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <Input
          label="Slug"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugManuallyEdited(true);
          }}
          hint="Editing the slug changes the public URL on next save."
        />
        <Textarea
          label="Excerpt"
          value={excerpt ?? ''}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={2}
        />

        <div className="rounded-sm border border-border-strong bg-bg overflow-hidden">
          <EditorToolbar
            editor={editor}
            onInsertImage={() => setShowImagePicker((v) => !v)}
            imagePickerOpen={showImagePicker}
          />
          {showImagePicker ? (
            <div className="px-4 py-3 border-b border-border bg-bg-alt">
              <ImageUploader
                bucket="blog-images"
                pathPrefix={`posts/${post?.id ?? 'unknown'}`}
                onUploaded={(url) => {
                  editor.chain().focus().setImage({ src: url, alt: '' }).run();
                  setShowImagePicker(false);
                }}
              />
            </div>
          ) : null}
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Sidebar — meta */}
      <aside className="space-y-6 min-w-0">
        <div className="space-y-3">
          <h3 className="font-micro text-[12px] uppercase tracking-[0.12em] text-fg-muted">
            Status
          </h3>
          <div className="flex items-center gap-3">
            <Switch
              checked={status === 'published'}
              onCheckedChange={(v) => setStatus(v ? 'published' : 'draft')}
            />
            <span className="font-body text-[14px] text-fg">
              {status === 'published' ? 'Published' : 'Draft'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={featured} onCheckedChange={setFeatured} />
            <span className="font-body text-[14px] text-fg">Featured post</span>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-micro text-[12px] uppercase tracking-[0.12em] text-fg-muted">
            Cover image
          </h3>
          <ImageUploader
            bucket="blog-images"
            pathPrefix={`covers/${post?.id ?? 'unknown'}`}
            onUploaded={(url) => setCoverImage(url)}
            initialPreviewUrl={coverImage || undefined}
          />
        </div>

        <Input
          label="Category"
          value={category ?? ''}
          onChange={(e) => setCategory(e.target.value)}
        />
      </aside>
    </div>
  );
}

interface EditorToolbarProps {
  editor: Editor;
  onInsertImage: () => void;
  imagePickerOpen: boolean;
}

function EditorToolbar({ editor, onInsertImage, imagePickerOpen }: EditorToolbarProps) {
  // Force re-renders on selection / active-mark changes so toolbar
  // active states stay in sync with the document.
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

      <div className="w-px h-6 bg-border mx-1" aria-hidden="true" />

      <button
        type="button"
        onClick={onInsertImage}
        title="Insert image"
        aria-label="Insert image"
        aria-pressed={imagePickerOpen}
        className={cn(
          'inline-flex h-8 items-center gap-1.5 px-2 rounded-sm',
          'font-micro text-[11px] uppercase tracking-[0.05em]',
          'transition-colors duration-150 ease-[cubic-bezier(0.25,1,0.5,1)]',
          'outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-alt',
          imagePickerOpen
            ? 'bg-accent/15 text-accent-deep'
            : 'text-fg-muted hover:text-fg hover:bg-bg',
        )}
      >
        <ImagePlus className="h-4 w-4" strokeWidth={1.5} />
        Image
      </button>
    </div>
  );
}

export default BlogEditor;
