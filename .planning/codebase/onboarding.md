# Onboarding — repo conventions detected

## Issue tracker

github: https://github.com/QualiaSolutionsCY/aquador

## Existing labels

| Existing label    | Maps to canonical |
|-------------------|-------------------|
| bug               | bug               |
| enhancement       | enhancement       |
| documentation     | no mapping        |
| duplicate         | no mapping        |
| good first issue  | ready-for-human   |
| help wanted       | ready-for-human   |
| invalid           | wontfix           |
| question          | needs-info        |
| wontfix           | wontfix           |

Missing canonical: `needs-triage`, `ready-for-agent`.

## Domain docs

- `docs/AI_ASSISTANT.md` — AI fragrance-assistant integration notes (OpenRouter).
- `docs/audits/2026-01-21-production-audit.md` — production audit findings.
- `docs/audits/2026-01-21-fix-plan.md` — remediation plan paired with audit.
- No `CONTEXT.md`, `GLOSSARY.md`, or ADR folder. Qualia creates `.planning/CONTEXT.md` + `.planning/decisions/`.

## Existing agent files

- `CLAUDE.md` — project-tracked, well-maintained (commands, architecture, env vars). CONSERVATIVE: append only, never overwrite.
- `HANDOFF.md` — prior-session handoff notes (root).
- `IMPLEMENTATION_PLAN.md` — large legacy implementation plan (root).
- `DEPLOYMENT.md` — deploy notes (root).
- No `AGENTS.md`, `.cursor/`, `.cursorrules`, `.aider.conf.yml`, `.continue/`.

## Existing planning artifacts

- `.planning/PROJECT.md` — STALE (Apr 10, 34d old)
- `.planning/MILESTONES.md` — STALE (Apr 10)
- `.planning/REQUIREMENTS.md` — STALE (Apr 10)
- `.planning/ROADMAP.md` — STALE (Apr 10)
- `.planning/STATE.md` — STALE (Apr 10)
- `.planning/milestones/` — v1.0 + v1.1 requirements/roadmaps + audit.
- `.planning/phases/` — 16 phase folders (01–17 + phase-1, phase-4).
- `.planning/quick/` — 7 quick-task folders.
- `.planning/agents/`, `.planning/codebase/` — empty (Qualia populates).
