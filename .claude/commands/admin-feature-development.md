---
name: admin-feature-development
description: Workflow command scaffold for admin-feature-development in aquador.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /admin-feature-development

Use this workflow when working on **admin-feature-development** in `aquador`.

## Goal

Implements new admin features or dashboards, including UI, API, types, and migrations.

## Common Files

- `src/app/admin/*/page.tsx`
- `src/app/admin/*/*.tsx`
- `src/app/api/admin/*/route.ts`
- `src/components/admin/*.tsx`
- `src/lib/*/*.ts`
- `src/lib/*/types.ts`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Create or update admin page component under src/app/admin/...
- Implement or update client logic under src/app/admin/... or src/components/admin/...
- Add or update API route under src/app/api/admin/...
- Update shared types or logic in src/lib/...
- Update or create Supabase migration(s) in supabase/migrations/

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.