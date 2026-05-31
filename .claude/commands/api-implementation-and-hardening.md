---
name: api-implementation-and-hardening
description: Workflow command scaffold for api-implementation-and-hardening in aquador.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /api-implementation-and-hardening

Use this workflow when working on **api-implementation-and-hardening** in `aquador`.

## Goal

Implements, hardens, and tests API endpoints, often with iterative improvements and test coverage.

## Common Files

- `src/app/api/*/route.ts`
- `src/lib/*/*.ts`
- `src/lib/*/__tests__/*.test.ts`
- `src/lib/*/types.ts`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Create or update API route under src/app/api/...
- Iteratively improve parsing, validation, or error handling in the route file
- Add or update related logic in src/lib/...
- Add or update tests in src/lib/*/__tests__/*.test.ts
- Optionally update types in src/lib/*/types.ts

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.