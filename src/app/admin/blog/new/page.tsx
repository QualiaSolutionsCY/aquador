import { BlogEditor } from '@/components/admin/BlogEditor';

export const dynamic = 'force-dynamic';

export default function NewBlogPostPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-[28px] leading-tight text-fg">
          New blog post
        </h1>
        <p className="mt-1 font-body text-[14px] text-fg-muted">
          Start with title and slug. Once the draft is created, the full editor
          opens with autosave on.
        </p>
      </header>
      <BlogEditor mode="create" />
    </div>
  );
}
