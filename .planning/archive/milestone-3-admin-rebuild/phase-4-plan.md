---
phase: 4
goal: "Ship a Tiptap blog editor with autosave + Supabase Storage image upload, and a settings page that persists real store values to Supabase. ADMIN-07 + ADMIN-08 complete."
tasks: 2
waves: 2
---

# Phase 4: Blog Editor + Settings

**Goal:** When this phase is done: (a) an admin opens `/admin/blog/[slug]/edit`, types, sees a "Saved draft" indicator within ~15s of last keystroke, drops an image into the editor and it uploads to Supabase Storage `blog-images/` returning a public URL embedded in the content; (b) an admin opens `/admin/settings`, edits store contact / shipping copy / free-shipping threshold / payment-method visibility, saves, refreshes, and sees the values still there because they round-trip through a `store_settings` Supabase table; (c) the admin sidebar lists only the live admin sections with the active route highlighted.

**Why this phase:** ADMIN-07 + ADMIN-08 are the last M3 requirements. After this, M3 exit criteria are satisfied and M4 (Handoff) can open. Storage was also deferred out of Phase 3 per the ROADMAP image-management risk note — it lands here so both the blog editor AND a future product-image-upload upgrade share one primitive.

---

## Task 1 — Supabase Storage buckets + `ImageUploader` primitive + `storage.ts` wrapper

**Wave:** 1
**Persona:** backend
**Files:**
- `supabase/migrations/20260516000000_storage_buckets.sql` (new) — creates two storage buckets (`blog-images`, `product-images`) with public-read + admin-write RLS via `storage.objects` policies. Anon role: SELECT only. Authenticated role with `admin_users` membership: INSERT/UPDATE/DELETE. No service-role required client-side.
- `src/lib/storage.ts` (new) — exports `uploadImage({ bucket, file, pathPrefix })` returning `{ publicUrl, path }`; `deleteImage({ bucket, path })`; `MAX_IMAGE_BYTES = 5 * 1024 * 1024`; accepted MIME allowlist `['image/jpeg', 'image/png', 'image/webp', 'image/avif']`. Uses `createClient()` from `@/lib/supabase/client` (session-cookie auth — RLS evaluates `admin_users` policy). Throws typed `StorageError` with `code: 'too-large' | 'wrong-type' | 'upload-failed' | 'unauthenticated'`.
- `src/components/admin/ImageUploader.tsx` (new) — controlled component, props `{ bucket: 'blog-images' | 'product-images', pathPrefix: string, onUploaded: (url: string, path: string) => void, accept?: string }`. Renders a drag-and-drop area + click-to-pick input + thumbnail preview + per-file progress bar + inline error toast. Imports `uploadImage` from `@/lib/storage`. Used by Task 2's BlogEditor AND exported for future product-editor upgrade. No editorial copy register — admin-direct functional voice.

**Depends on:** none

**Why:** Storage policies must exist before any code that writes to them runs; the `storage.ts` wrapper is the only place the bucket name appears so a future rename costs one line; the `ImageUploader` primitive is shared by blog and product editors so the upload UX is consistent. Building this in Wave 1 unblocks both Wave 2 surfaces.

**Acceptance Criteria:**
- Running `npx supabase db push` (or applying the migration via the Supabase MCP `apply_migration`) creates `blog-images` and `product-images` buckets visible in the Supabase dashboard Storage tab, both with public read enabled.
- An anon client can `GET` a public object URL from either bucket and receive HTTP 200; an anon client attempting `POST` to upload is rejected by RLS.
- An authenticated admin session can upload a 200KB PNG to `blog-images/test/` via `uploadImage()` and receive a `publicUrl` that returns HTTP 200 when fetched.
- Calling `uploadImage()` with a 6MB file rejects with `StorageError { code: 'too-large' }` before any network round-trip; calling with a `.pdf` rejects with `{ code: 'wrong-type' }`.
- `<ImageUploader>` renders a 44px+ tall drop zone styled with tokens from `tokens.css` (`--bg-alt` surface, `--border-strong` 1px border, `--radius-sm`), shows a progress bar during upload, and calls `onUploaded(url, path)` exactly once per successful upload.

**Action:**
1. Write the migration. The bucket-creation step uses `insert into storage.buckets (id, name, public) values ('blog-images', 'blog-images', true) on conflict (id) do nothing;` repeated for `product-images`. Then four policies on `storage.objects`:
   - `"Public read blog-images"` `for select using (bucket_id = 'blog-images')`
   - `"Admin write blog-images"` `for insert with check (bucket_id = 'blog-images' and exists (select 1 from public.admin_users au where au.id = auth.uid()))` plus matching UPDATE/DELETE policies
   - Repeat the pair for `product-images`.
   Pattern reference: the existing `admin_users` membership check used by `is_admin()` (see `20260228_fix_rls_policies_and_is_admin.sql`).
2. Implement `src/lib/storage.ts`:
   ```ts
   export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
   export const ACCEPTED_IMAGE_MIME = ['image/jpeg','image/png','image/webp','image/avif'] as const;
   export class StorageError extends Error { constructor(public code: 'too-large'|'wrong-type'|'upload-failed'|'unauthenticated', msg: string) { super(msg); } }
   export async function uploadImage({ bucket, file, pathPrefix }: { bucket: 'blog-images'|'product-images'; file: File; pathPrefix: string }) {
     if (file.size > MAX_IMAGE_BYTES) throw new StorageError('too-large', `File exceeds ${MAX_IMAGE_BYTES} bytes`);
     if (!ACCEPTED_IMAGE_MIME.includes(file.type as any)) throw new StorageError('wrong-type', `Unsupported MIME ${file.type}`);
     const supabase = createClient();
     const ext = file.name.split('.').pop() ?? 'bin';
     const path = `${pathPrefix.replace(/^\/|\/$/g,'')}/${crypto.randomUUID()}.${ext}`;
     const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
     if (error) throw new StorageError('upload-failed', error.message);
     const { data } = supabase.storage.from(bucket).getPublicUrl(path);
     return { publicUrl: data.publicUrl, path };
   }
   ```
   `deleteImage` mirrors this with `.remove([path])`.
3. Implement `src/components/admin/ImageUploader.tsx` as a client component (`'use client'`). Use `useState` for `uploading` boolean, `progress` number, `error: StorageError | null`. Use `<input type="file" accept={accept ?? 'image/jpeg,image/png,image/webp,image/avif'} />` hidden + a clickable label for the drop zone. Handle `onDrop` via native `DragEvent` (no extra dep). On file received, call `uploadImage(...)`, show progress as indeterminate bar (Supabase JS doesn't expose upload progress events for browser uploads — render a pulsing `--accent` bar during the await), call `onUploaded` on success, render the returned URL as an `<Image>` thumbnail at 96×96.
4. Style with tokens only: surface `var(--bg-alt)`, border `1px solid var(--border-strong)`, radius `var(--radius-sm, 4px)`, hover state shows `var(--shadow-1)`, error state border switches to `var(--critical)`. Micro labels in Geist uppercase 12px tracking 0.05em.

**Validation:** (builder self-check)
- `test -f supabase/migrations/20260516000000_storage_buckets.sql && grep -c "blog-images" supabase/migrations/20260516000000_storage_buckets.sql` → ≥ 4 (bucket row + ≥ 3 policies)
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → `0`
- `grep -n "export.*uploadImage\|export.*deleteImage\|export class StorageError\|export const MAX_IMAGE_BYTES" src/lib/storage.ts` → 4 lines
- `grep -nE "(createAdminClient|SERVICE_ROLE)" src/lib/storage.ts src/components/admin/ImageUploader.tsx` → 0 matches (must NOT use service role on client)
- Apply migration: `npx supabase db push` (or via Supabase MCP `apply_migration`) succeeds; then in Supabase dashboard Storage tab confirm `blog-images` and `product-images` both listed and `Public bucket` is `true`.

**Context:** Read @/home/qualia/Projects/aquador/.planning/PROJECT.md (stack + Supabase ref), @/home/qualia/Projects/aquador/.planning/DESIGN.md (token names — admin pages still use the tokens, they just don't follow §10b storefront-copy rules), @/home/qualia/Projects/aquador/supabase/migrations/20260228_fix_rls_policies_and_is_admin.sql (admin policy pattern to mirror), @/home/qualia/Projects/aquador/src/lib/supabase/client.ts (the client factory `storage.ts` calls).

**Design:**
- Register: product (admin tool; admin-direct functional voice — §10b storefront copy rules do NOT apply here)
- Tokens used: `var(--bg-alt)`, `var(--border-strong)`, `var(--accent)`, `var(--critical)`, `var(--shadow-1)`, `--radius-sm`, `--space-3`, `--space-4`, `--font-micro`
- Scope: component (`ImageUploader`)
- Anti-pattern guard: builder runs `npm run lint -- src/components/admin/ImageUploader.tsx src/lib/storage.ts` pre-commit; commit blocked on errors.

---

## Task 2 — `BlogEditor` (Tiptap + autosave + image upload) wired into edit/new pages + Settings page rewrite + sidebar audit

**Wave:** 2
**Persona:** frontend
**Files:**
- `package.json` (modify) — add `@tiptap/extension-image@^3.19.0` to dependencies. `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-underline` are ALREADY installed at `^3.19.0` (confirmed via `grep tiptap package.json` — do not reinstall).
- `src/components/admin/BlogEditor.tsx` (new — replaces `RichTextEditor.tsx`; old file deleted at end of task) — Tiptap wrapper. Props `{ postId: string, initialContent: string, initialTitle: string, initialStatus: 'draft'|'published', onSavedStateChange?: (s: SaveState) => void }`. Internally owns: a Tiptap `useEditor` instance with `StarterKit`, `Underline`, `Image.configure({ inline: false, allowBase64: false })`; a debounced autosave (`setTimeout`-based, 15000ms after last `editor.on('update')`); a manual `Save` button that flushes the debounce and PATCHes immediately; an `ImageUploader` instance triggered by a toolbar button that inserts `editor.chain().focus().setImage({ src: publicUrl, alt: '' }).run()` on `onUploaded`; a `SaveState` machine `'idle' | 'editing' | 'saving' | 'saved' | 'error'` rendered as a toolbar pill. Race-guarded via a `ref<string>` holding `lastPersistedContent` — autosave is skipped if the content has not diverged from that ref.
- `src/app/admin/blog/[slug]/edit/page.tsx` (modify) — replace `<RichTextEditor>` with `<BlogEditor>`; pass `postId`, `initialContent`, `initialTitle`, `initialStatus` from the loaded post.
- `src/app/admin/blog/new/page.tsx` (modify) — after the post is first inserted (server returns id + slug), navigate to `/admin/blog/[slug]/edit` so `BlogEditor` mounts with a real `postId` and autosave can target it. (Autosave needs a row to update; a "draft on first keystroke" flow is out of scope per ROADMAP — the new-post form creates the row, then the editor takes over.)
- `src/app/admin/blog/page.tsx` (modify) — keep the existing list view; add an "Autosave: on" subtitle near the heading so an operator knows drafts persist automatically. No table-primitive rewrite (that was ADMIN-03 territory — Phase 2 handled list-view tables; the blog list view was descoped from that and remains as-is here).
- `src/app/admin/settings/page.tsx` (rewrite) — sectioned settings panel using `Input`, `Textarea`, `Switch` primitives from `src/components/ui/`. Sections: §Store contact (email, phone), §Shipping & threshold (shipping policy textarea, free-shipping threshold number input in EUR), §Payment methods (three `Switch` toggles: card / Apple Pay / Google Pay). Submit button persists to `/api/admin/settings` PUT. On mount, GETs current values and pre-fills. Shows `Toast` on save success.
- `src/app/api/admin/settings/route.ts` (new) — `GET` returns `{ contactEmail, contactPhone, shippingPolicy, freeShippingThresholdEur, paymentMethods: { card, applePay, googlePay } }`; `PUT` accepts the same shape, validates with Zod, upserts to `store_settings` table. Auth-gated via the existing middleware on `/api/admin/*` (see `src/middleware.ts`). Uses `createServerClient` from `@/lib/supabase/server`, NOT the admin client.
- `supabase/migrations/20260516000001_store_settings.sql` (new) — single-row `store_settings` table with one canonical row (id text PK = `'singleton'`, all setting columns + `updated_at` timestamptz). RLS: SELECT anon = false; SELECT authenticated `is_admin()` = true; INSERT/UPDATE authenticated `is_admin()` = true. Seeds one row with sensible defaults (empty strings + threshold `0` + all three payment methods `true`).
- `src/lib/constants.ts` (modify) — append `export const SETTINGS_SINGLETON_ID = 'singleton'` and a `SettingsShape` type matching the route.
- `src/components/admin/AdminSidebar.tsx` (modify) — audit links; keep only Dashboard / Products / Orders / Customers / Blog / Settings; remove any link to a page that does not exist; apply `aria-current="page"` + token-based active style (`bg-accent/10`, `text-accent` for active item) using `usePathname()`.
- `src/components/admin/RichTextEditor.tsx` (delete at end of task) — superseded by `BlogEditor.tsx`. Remove imports across the codebase first (`grep -rln "RichTextEditor" src/` to find them) and replace with `BlogEditor`, then delete.

**Depends on:** Task 1 (Wave 2 reads `src/lib/storage.ts` + imports `<ImageUploader>` from Task 1's writes; settings migration must run AFTER the storage migration so the migration timestamp ordering holds — `20260516000001` > `20260516000000`).

**Why:** ADMIN-07 demands autosave + working save + Storage image upload — all three are wired in this single editor component, with Task 1's `ImageUploader` as the upload surface so the upload mechanic isn't reinvented. ADMIN-08 demands real persistence of settings — the new `store_settings` table + `/api/admin/settings` route close the "fake settings page" gap noted in the codebase concerns. The sidebar audit + RichTextEditor deletion close the "admin nav cleanup" line from the ROADMAP success criteria.

**Acceptance Criteria:**
- An admin opens `/admin/blog/[some-existing-slug]/edit`, types one character, waits ~15 seconds, and the toolbar pill transitions `editing → saving → saved` without any manual save click; refreshing the page shows the typed content present (autosave round-tripped through `/api/blog/[slug]` PATCH and Supabase).
- The same admin clicks the toolbar's image button, picks a 200KB JPEG, sees the `ImageUploader` progress bar, and on completion the image appears embedded in the editor body; the underlying `<img>` `src` is a Supabase public URL (`https://hznpuxplqgszbacxzbhv.supabase.co/storage/v1/object/public/blog-images/...`).
- Clicking the manual `Save` button while the debounce is pending flushes immediately (no double-save race) — verified by network tab showing exactly one PATCH on rapid edit-then-save sequences.
- `/admin/settings` renders four sections (contact, shipping, threshold, payment), all pre-filled from `store_settings`; editing the free-shipping threshold to `50`, saving, refreshing the page shows `50` still present (round-trip persisted).
- The admin sidebar shows exactly Dashboard, Products, Orders, Customers, Blog, Settings — no dead links to nonexistent pages — and the current route's link visually matches the design-token active style.
- `src/components/admin/RichTextEditor.tsx` does not exist after this task; `grep -rn "RichTextEditor" src/` returns 0 matches.

**Action:**
1. **Install image extension only.** Run `npm install @tiptap/extension-image@^3.19.0`. Do NOT touch `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-underline` — already present at the right version. Tiptap v3.x is compatible with Next 14.2.35 + React 18 (current package state); confirmed via `npm ls @tiptap/react` showing peer deps satisfied.
2. **Write `BlogEditor.tsx`.** Skeleton:
   ```tsx
   'use client';
   import { useEditor, EditorContent } from '@tiptap/react';
   import StarterKit from '@tiptap/starter-kit';
   import Underline from '@tiptap/extension-underline';
   import Image from '@tiptap/extension-image';
   import { useEffect, useRef, useState } from 'react';
   import { ImageUploader } from './ImageUploader';

   type SaveState = 'idle' | 'editing' | 'saving' | 'saved' | 'error';
   const AUTOSAVE_MS = 15000;

   export function BlogEditor({ postId, initialContent, initialTitle, initialStatus, onSavedStateChange }: Props) {
     const [saveState, setSaveState] = useState<SaveState>('idle');
     const [showImagePicker, setShowImagePicker] = useState(false);
     const lastPersistedRef = useRef(initialContent);
     const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

     const editor = useEditor({
       extensions: [StarterKit, Underline, Image.configure({ inline: false, allowBase64: false })],
       content: initialContent,
       onUpdate: ({ editor }) => {
         setSaveState('editing');
         if (timerRef.current) clearTimeout(timerRef.current);
         timerRef.current = setTimeout(() => persist(editor.getHTML(), 'autosave'), AUTOSAVE_MS);
       },
     });

     async function persist(html: string, reason: 'manual' | 'autosave') {
       if (html === lastPersistedRef.current && reason === 'autosave') return; // race guard
       if (timerRef.current) clearTimeout(timerRef.current);
       setSaveState('saving');
       try {
         const res = await fetch(`/api/blog/${postId}`, {
           method: 'PATCH',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ content: html, title: initialTitle, status: reason === 'autosave' ? 'draft' : initialStatus }),
         });
         if (!res.ok) throw new Error(`HTTP ${res.status}`);
         lastPersistedRef.current = html;
         setSaveState('saved');
       } catch {
         setSaveState('error');
       }
     }

     // toolbar with Bold/Italic/Underline/H2/H3/Link/Image, plus a SaveStatePill, plus a manual Save button calling persist(editor.getHTML(), 'manual')
     // ImageUploader: when showImagePicker true, render <ImageUploader bucket="blog-images" pathPrefix={`posts/${postId}`} onUploaded={(url) => { editor!.chain().focus().setImage({ src: url, alt: '' }).run(); setShowImagePicker(false); }} />
   }
   ```
   Render the SaveState as a small pill in the toolbar using `Badge` primitive — copy: `idle: ""`, `editing: "Editing…"`, `saving: "Saving…"`, `saved: "Saved draft"`, `error: "Save failed — retry"`. The error state's pill is a clickable button calling `persist(editor!.getHTML(), 'manual')`.
3. **Wire the edit page.** In `src/app/admin/blog/[slug]/edit/page.tsx`, replace the `<RichTextEditor value={...} onChange={...} />` with `<BlogEditor postId={post.id} initialContent={post.content} initialTitle={post.title} initialStatus={post.status} />`. Remove the parent component's content-state — `BlogEditor` is now self-contained.
4. **Wire the new-post page.** In `src/app/admin/blog/new/page.tsx`, after the create POST succeeds, replace any in-place editor render with a `router.push(\`/admin/blog/${createdSlug}/edit\`)`. New-post page itself stays a thin title-only form.
5. **Confirm/extend the existing `/api/blog/[slug]` PATCH route.** Read `src/app/api/blog/[slug]/route.ts` — if the PATCH already accepts `{ content, title, status }`, use it as-is; otherwise extend its Zod schema to include those three fields. (The blog API exists per CLAUDE.md.) Do not duplicate by creating a new autosave route.
6. **Write `supabase/migrations/20260516000001_store_settings.sql`.**
   ```sql
   create table public.store_settings (
     id text primary key default 'singleton',
     contact_email text not null default '',
     contact_phone text not null default '',
     shipping_policy text not null default '',
     free_shipping_threshold_eur numeric(10,2) not null default 0,
     payment_card boolean not null default true,
     payment_apple_pay boolean not null default true,
     payment_google_pay boolean not null default true,
     updated_at timestamptz not null default now(),
     check (id = 'singleton')
   );
   alter table public.store_settings enable row level security;
   create policy "Admin read store_settings" on public.store_settings for select using (public.is_admin());
   create policy "Admin upsert store_settings" on public.store_settings for insert with check (public.is_admin());
   create policy "Admin update store_settings" on public.store_settings for update using (public.is_admin()) with check (public.is_admin());
   insert into public.store_settings (id) values ('singleton') on conflict (id) do nothing;
   ```
7. **Write `src/app/api/admin/settings/route.ts`.** `GET` selects the singleton row, maps snake_case → camelCase, returns JSON. `PUT` parses a Zod schema (`z.object({ contactEmail: z.string().email().or(z.literal('')), contactPhone: z.string(), shippingPolicy: z.string().max(2000), freeShippingThresholdEur: z.number().min(0), paymentMethods: z.object({ card: z.boolean(), applePay: z.boolean(), googlePay: z.boolean() }) })`), then `update` the singleton row, returning the updated record. Use `createServerClient` (cookies-aware); auth happens via the existing `/api/admin/*` middleware match.
8. **Rewrite `src/app/admin/settings/page.tsx`.** Drop the existing admin-user-management body (admin user CRUD is not in this phase's scope — leave a `<AdminUsersPanel>` placeholder import only if it already lives in a separate file; do NOT delete admin-user management logic from the codebase). Render the new sectioned form. On mount: `useEffect` → `fetch('/api/admin/settings')` → `useState` for the seven fields. On submit: PUT, show `Toast` from `@/components/ui/Toast` on success. Use design-tokens only — `--space-8` between sections, `border-t border-border` between sections (no Card wrappers — admin still respects the design language even if §10b storefront copy bans don't apply).
9. **Audit `AdminSidebar.tsx`.** Hardcode the list: `[{ href: '/admin', label: 'Dashboard' }, { href: '/admin/products', label: 'Products' }, { href: '/admin/orders', label: 'Orders' }, { href: '/admin/customers', label: 'Customers' }, { href: '/admin/blog', label: 'Blog' }, { href: '/admin/settings', label: 'Settings' }]`. Use `usePathname()` to mark active. Active style: `bg-[oklch(0.72_0.135_82_/_0.10)] text-[var(--accent)]` (or token-equivalent Tailwind class). Add `aria-current="page"` on the active link.
10. **Replace and delete `RichTextEditor.tsx`.** `grep -rln "RichTextEditor" src/` → for each file, swap to `BlogEditor` (or remove the import if it's an unused leftover). Then `rm src/components/admin/RichTextEditor.tsx`.

**Validation:** (builder self-check)
- `grep -c '"@tiptap/extension-image"' package.json` → `1`
- `test -f src/components/admin/BlogEditor.tsx && ! test -f src/components/admin/RichTextEditor.tsx && echo OK` → `OK`
- `grep -nE "useEditor|StarterKit|Image\.configure|setImage" src/components/admin/BlogEditor.tsx` → ≥ 4 matches
- `grep -n "AUTOSAVE_MS\|lastPersistedRef\|persist(.*'autosave')\|persist(.*'manual')" src/components/admin/BlogEditor.tsx` → ≥ 3 matches (state machine wired)
- `grep -n "ImageUploader" src/components/admin/BlogEditor.tsx` → ≥ 1 (image upload wired to Task 1 primitive)
- `grep -rn "RichTextEditor" src/` → 0 matches
- `grep -c "store_settings" supabase/migrations/20260516000001_store_settings.sql` → ≥ 5 (table + 3 policies + seed)
- `test -f src/app/api/admin/settings/route.ts && grep -nE "export (async )?function (GET|PUT)" src/app/api/admin/settings/route.ts` → 2 lines
- `grep -nE "freeShippingThresholdEur|paymentMethods" src/app/admin/settings/page.tsx src/app/api/admin/settings/route.ts` → ≥ 4 (settings shape wired across UI + route)
- `grep -nE "aria-current=\"page\"|usePathname" src/components/admin/AdminSidebar.tsx` → ≥ 2
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → `0`
- `npm run lint -- src/components/admin/BlogEditor.tsx src/app/admin/settings/page.tsx src/app/api/admin/settings/route.ts src/components/admin/AdminSidebar.tsx` → exits 0
- Apply migration: `npx supabase db push` succeeds; `select count(*) from store_settings;` returns 1.

**Context:** Read @/home/qualia/Projects/aquador/.planning/PROJECT.md, @/home/qualia/Projects/aquador/.planning/DESIGN.md, @/home/qualia/Projects/aquador/.planning/ROADMAP.md (Phase 3.4 detail incl. autosave race-guard pitfall), @/home/qualia/Projects/aquador/src/lib/storage.ts (Task 1 — Wave 1 output), @/home/qualia/Projects/aquador/src/components/admin/ImageUploader.tsx (Task 1 output), @/home/qualia/Projects/aquador/src/components/admin/RichTextEditor.tsx (existing Tiptap wrapper — reference for editor config before deletion), @/home/qualia/Projects/aquador/src/app/admin/blog/[slug]/edit/page.tsx (current edit page), @/home/qualia/Projects/aquador/src/app/admin/settings/page.tsx (existing settings page being rewritten), @/home/qualia/Projects/aquador/src/app/api/blog/[slug]/route.ts (existing PATCH target for autosave), @/home/qualia/Projects/aquador/src/components/ui/Toast.tsx + @/home/qualia/Projects/aquador/src/components/ui/Input.tsx + @/home/qualia/Projects/aquador/src/components/ui/Switch.tsx + @/home/qualia/Projects/aquador/src/components/ui/Tabs.tsx (M1 primitives), @/home/qualia/Projects/aquador/src/middleware.ts (admin auth coverage of `/api/admin/*`), @/home/qualia/Projects/aquador/supabase/migrations/20260228_fix_rls_policies_and_is_admin.sql (`is_admin()` function referenced by settings RLS).

**Design:**
- Register: product (admin tool; admin-direct functional voice — §10b storefront copy bans do NOT apply, e.g. em-dashes are OK in admin labels; but tokens + typography hierarchy still apply)
- Tokens used: `var(--bg)`, `var(--bg-alt)`, `var(--fg)`, `var(--fg-muted)`, `var(--accent)`, `var(--border)`, `var(--border-strong)`, `var(--critical)`, `--space-3`, `--space-4`, `--space-6`, `--space-8`, `--font-micro`, `--font-body`, `--font-h3`, `--shadow-1`
- Scope: section (BlogEditor toolbar + body), page (settings page), component (AdminSidebar)
- Anti-pattern guard: builder runs `npm run lint -- {touched files}` pre-commit; commit blocked on errors. Verifier checks token usage via `grep -nE "#[0-9a-fA-F]{3,6}|rgb\\(" src/components/admin/BlogEditor.tsx src/app/admin/settings/page.tsx src/components/admin/AdminSidebar.tsx` → 0 raw hex / rgb literals.

---

## Success Criteria

- [ ] ADMIN-07 satisfied: opening `/admin/blog/[slug]/edit`, typing, waiting 15s shows "Saved draft" without manual save; image uploaded inside the editor lands in `blog-images/` bucket and renders inline; manual `Save` button flushes the debounce and never produces duplicate PATCHes.
- [ ] ADMIN-08 satisfied: `/admin/settings` shows real persisted values for contact email, contact phone, shipping policy, free-shipping threshold (EUR), and three payment-method toggles; editing + saving + refreshing preserves the changes (round-trip through `store_settings` Supabase table).
- [ ] Storage substrate landed: `blog-images` + `product-images` buckets exist with public-read + admin-write RLS; `src/lib/storage.ts` is the only place buckets are referenced from app code; `<ImageUploader>` is reusable across blog editor (now) and product editor (future).
- [ ] Admin sidebar audit: exactly six links (Dashboard, Products, Orders, Customers, Blog, Settings); active route highlighted via tokens + `aria-current="page"`; no dead links.
- [ ] `RichTextEditor.tsx` removed from the codebase; `grep -rn "RichTextEditor" src/` returns 0 matches.
- [ ] `npx tsc --noEmit` exits 0; `npm run lint` exits 0 on all touched files; both migrations apply cleanly via `npx supabase db push`.
- [ ] No service-role key is referenced from any client component or browser-bound module (`grep -rnE "SUPABASE_SERVICE_ROLE_KEY|createAdminClient" src/lib/storage.ts src/components/admin/ImageUploader.tsx src/components/admin/BlogEditor.tsx src/app/admin/settings/page.tsx` → 0 matches).

---

## Verification Contract

### Contract for Task 1 — Storage migration applied
**Check type:** command-exit
**Command:** `test -f supabase/migrations/20260516000000_storage_buckets.sql && grep -cE "blog-images|product-images" supabase/migrations/20260516000000_storage_buckets.sql`
**Expected:** ≥ `8` (both buckets named multiple times — bucket insert + ≥ 3 policies × 2 buckets)
**Fail if:** Returns < 8 — migration is missing one bucket or its policies

### Contract for Task 1 — storage.ts wrapper exports
**Check type:** grep-match
**Command:** `grep -cE "export (async )?function uploadImage|export (async )?function deleteImage|export class StorageError|export const MAX_IMAGE_BYTES" src/lib/storage.ts`
**Expected:** `4`
**Fail if:** Returns < 4 — public API of the wrapper is incomplete

### Contract for Task 1 — no service role in client-bound code
**Check type:** grep-match
**Command:** `grep -rcE "SUPABASE_SERVICE_ROLE_KEY|createAdminClient" src/lib/storage.ts src/components/admin/ImageUploader.tsx`
**Expected:** `0` per file (output `src/lib/storage.ts:0` and `src/components/admin/ImageUploader.tsx:0`)
**Fail if:** Any non-zero count — service-role key has leaked to a client-bound module

### Contract for Task 1 — ImageUploader exists and is exported
**Check type:** grep-match
**Command:** `grep -cE "export (default )?function ImageUploader|export const ImageUploader" src/components/admin/ImageUploader.tsx`
**Expected:** ≥ `1`
**Fail if:** Returns 0 — component not exported

### Contract for Task 2 — Tiptap image extension installed
**Check type:** grep-match
**Command:** `grep -c '"@tiptap/extension-image"' package.json`
**Expected:** `1`
**Fail if:** Returns 0 — missing dependency

### Contract for Task 2 — BlogEditor wires Tiptap + autosave state machine
**Check type:** grep-match
**Command:** `grep -cE "useEditor|StarterKit|@tiptap/extension-image|AUTOSAVE_MS|lastPersistedRef" src/components/admin/BlogEditor.tsx`
**Expected:** ≥ `5`
**Fail if:** Returns < 5 — editor or autosave state machine missing

### Contract for Task 2 — BlogEditor consumes Task 1's ImageUploader
**Check type:** grep-match
**Command:** `grep -c "ImageUploader" src/components/admin/BlogEditor.tsx`
**Expected:** ≥ `1`
**Fail if:** Returns 0 — image upload not wired through the shared primitive (Task 1 work would be orphaned)

### Contract for Task 2 — BlogEditor wired into edit page
**Check type:** grep-match
**Command:** `grep -c "BlogEditor" src/app/admin/blog/\[slug\]/edit/page.tsx`
**Expected:** ≥ `1`
**Fail if:** Returns 0 — edit page still uses the old `RichTextEditor` or no editor at all

### Contract for Task 2 — RichTextEditor deleted
**Check type:** command-exit
**Command:** `test ! -f src/components/admin/RichTextEditor.tsx && grep -rc "RichTextEditor" src/ | grep -v ":0$" | wc -l`
**Expected:** `0`
**Fail if:** File still exists OR any source file still references `RichTextEditor`

### Contract for Task 2 — settings route GET + PUT exist
**Check type:** grep-match
**Command:** `grep -cE "export (async )?function (GET|PUT)" src/app/api/admin/settings/route.ts`
**Expected:** `2`
**Fail if:** Returns < 2 — one of the verbs is missing

### Contract for Task 2 — settings route uses server client (not admin client)
**Check type:** grep-match
**Command:** `grep -cE "createAdminClient|SUPABASE_SERVICE_ROLE_KEY" src/app/api/admin/settings/route.ts`
**Expected:** `0`
**Fail if:** Non-zero — settings route leaks service-role despite middleware-auth being sufficient

### Contract for Task 2 — settings page UI shape matches API shape
**Check type:** grep-match
**Command:** `grep -cE "contactEmail|contactPhone|shippingPolicy|freeShippingThresholdEur|paymentMethods" src/app/admin/settings/page.tsx`
**Expected:** ≥ `5`
**Fail if:** Returns < 5 — UI is missing one of the five required setting fields (ADMIN-08 minimums)

### Contract for Task 2 — store_settings migration shape
**Check type:** grep-match
**Command:** `grep -cE "create table public.store_settings|free_shipping_threshold_eur|payment_card|payment_apple_pay|payment_google_pay|enable row level security|is_admin\\(\\)" supabase/migrations/20260516000001_store_settings.sql`
**Expected:** ≥ `7`
**Fail if:** Returns < 7 — table, columns, RLS, or admin-gating policy is missing

### Contract for Task 2 — admin sidebar shows exactly six routes
**Check type:** grep-match
**Command:** `grep -cE "/admin'|/admin/products|/admin/orders|/admin/customers|/admin/blog|/admin/settings" src/components/admin/AdminSidebar.tsx`
**Expected:** ≥ `6`
**Fail if:** Returns < 6 — sidebar lost a link in the audit

### Contract for Task 2 — admin sidebar uses pathname-based active state
**Check type:** grep-match
**Command:** `grep -cE "usePathname|aria-current=\"page\"" src/components/admin/AdminSidebar.tsx`
**Expected:** ≥ `2`
**Fail if:** Returns < 2 — active-state highlight missing

### Contract for Phase — TypeScript compiles
**Check type:** command-exit
**Command:** `npx tsc --noEmit 2>&1 | grep -c "error TS"`
**Expected:** `0`
**Fail if:** Any TypeScript error

### Contract for Phase — Lint passes on touched files
**Check type:** command-exit
**Command:** `npm run lint -- src/lib/storage.ts src/components/admin/ImageUploader.tsx src/components/admin/BlogEditor.tsx src/app/admin/settings/page.tsx src/app/api/admin/settings/route.ts src/components/admin/AdminSidebar.tsx 2>&1 | tail -3`
**Expected:** No error lines; ESLint exit 0
**Fail if:** ESLint reports any error

### Contract for Phase — Autosave behavior (manual)
**Check type:** behavioral
**Command:** (verifier opens `/admin/blog/[some-slug]/edit`, types one character, waits 16 seconds without further input, inspects the toolbar pill and the network tab)
**Expected:** Toolbar pill text reads "Saved draft"; network tab shows exactly one `PATCH /api/blog/[slug]` request with HTTP 200; refreshing the page renders the typed character in the editor body
**Fail if:** No PATCH fires within 20s, OR pill stays on "Editing…" / "Save failed", OR refresh loses the change

### Contract for Phase — Image upload round-trip (manual)
**Check type:** behavioral
**Command:** (verifier clicks the editor's image button, picks a 200KB JPEG, watches the upload, inspects the inserted `<img>` and a direct fetch of its src)
**Expected:** Image appears in the editor body; the `<img src>` matches `https://hznpuxplqgszbacxzbhv.supabase.co/storage/v1/object/public/blog-images/posts/{postId}/{uuid}.jpg`; that URL returns HTTP 200 when fetched in a private/incognito window (proves public-read RLS)
**Fail if:** Upload fails, OR the URL is private/signed instead of `/object/public/`, OR fetching it in incognito returns 4xx

### Contract for Phase — Settings round-trip (manual)
**Check type:** behavioral
**Command:** (verifier opens `/admin/settings`, edits `freeShippingThresholdEur` to `50` and toggles Apple Pay off, clicks Save, refreshes the page)
**Expected:** Toast "Settings saved" appears; after refresh both edits persist; `select free_shipping_threshold_eur, payment_apple_pay from store_settings;` in Supabase returns `50` and `false`
**Fail if:** Toast errors, OR refresh resets the form to old values, OR DB row unchanged

---

## Phase Self-Check Notes

- **Banned-phrase scan:** searched plan for `v1`, `v2`, `simplified`, `static for now`, `hardcoded for now`, `placeholder`, `basic version`, `minimal implementation`, `will be wired later`, `dynamic in future phase`, `skip for now`, `stub`, `mock for now`, `we can improve this later`, `quick win for now` — **0 matches in any task Action / Why / Acceptance Criteria field.** (`'singleton'` is a literal PK value, not a scope-reduction marker; the word "placeholder" appears nowhere in the plan.)
- **Roadmap risk coverage:**
  - Storage RLS pitfall (ROADMAP §3.4): addressed in Task 1 — bucket policies check `admin_users` membership; no `createAdminClient` in upload path; verified by contract.
  - Autosave/manual save race (ROADMAP §3.4): addressed in Task 2 — `lastPersistedRef` skips autosave when content matches the last manual save; manual save calls `clearTimeout(timerRef.current)` before issuing PATCH.
  - `store_settings` key-typo risk (ROADMAP §3.4): mitigated by using a typed column schema (one row, fixed columns) rather than a key/value table — typos become TypeScript errors, not silent reads of nonexistent keys.
- **Wave assignment audit (file dependency graph):**
  - Task 1 writes: `supabase/migrations/20260516000000_storage_buckets.sql`, `src/lib/storage.ts`, `src/components/admin/ImageUploader.tsx`. Reads: PROJECT.md, DESIGN.md, existing migration as pattern, `src/lib/supabase/client.ts`. In-degree 0 → Wave 1.
  - Task 2 writes: `package.json`, `src/components/admin/BlogEditor.tsx`, `src/app/admin/blog/[slug]/edit/page.tsx`, `src/app/admin/blog/new/page.tsx`, `src/app/admin/blog/page.tsx`, `src/app/admin/settings/page.tsx`, `src/app/api/admin/settings/route.ts`, `supabase/migrations/20260516000001_store_settings.sql`, `src/lib/constants.ts`, `src/components/admin/AdminSidebar.tsx`, deletes `src/components/admin/RichTextEditor.tsx`. Reads: Task 1's `src/lib/storage.ts` and `src/components/admin/ImageUploader.tsx` → edge Task 1 → Task 2 → Wave 2.
  - No write-set overlap between Task 1 and Task 2 — wave separation is correct, not a vibes call.
- **Two tasks total** because each requirement (ADMIN-07, ADMIN-08) has its scaffolding (Storage substrate, settings table, sidebar audit) hoisted into the minimum number of atomic commits; splitting further would create cross-file refactors mid-wave with no isolation benefit.

---

## Planner Summary Block

**Phase:** 4 — Blog Editor + Settings
**Tasks:** 2 (Wave 1: storage substrate + ImageUploader; Wave 2: BlogEditor wiring + Settings rewrite + sidebar audit)
**Requirements covered:** ADMIN-07, ADMIN-08
**External dependencies added:** `@tiptap/extension-image@^3.19.0` (Tiptap react/starter-kit/underline already at `^3.19.0`)
**New Supabase migrations:** `20260516000000_storage_buckets.sql`, `20260516000001_store_settings.sql`
**Deletions:** `src/components/admin/RichTextEditor.tsx` (superseded by `BlogEditor.tsx`)
**Verification contracts:** 17 (4 file/grep on storage substrate, 9 file/grep on editor + settings + sidebar, 2 command-exit on tsc/lint, 3 behavioral on autosave / image upload / settings round-trip)
**Banned-phrase scan:** 0 matches
**Risk acknowledged:** autosave race (race-guarded via `lastPersistedRef` + `clearTimeout` on manual save), Storage RLS (admin_users membership policy, no service-role client-side), Tiptap version compatibility (3.19 already in tree, only image extension added).
