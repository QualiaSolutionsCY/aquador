# GitHub labels — aquador

Canonical Qualia roles mapped to existing repo labels.

## Mapping (existing → canonical)

| Existing label    | Canonical role     |
|-------------------|--------------------|
| bug               | bug                |
| enhancement       | enhancement        |
| good first issue  | ready-for-human    |
| help wanted       | ready-for-human    |
| question          | needs-info         |
| invalid           | wontfix            |
| wontfix           | wontfix            |
| documentation     | (no mapping — keep as-is) |
| duplicate         | (no mapping — keep as-is) |

## Missing canonicals — create before `/qualia-issues` runs

- `needs-triage` — newly-filed issues awaiting routing
- `ready-for-agent` — issues an autonomous agent (or `/qualia-build`) can pick up

```bash
gh label create needs-triage --description "Awaiting triage routing" --color "ededed"
gh label create ready-for-agent --description "Ready for autonomous build" --color "0e8a16"
```

## Notes

- Treat `good first issue` and `help wanted` as `ready-for-human` (both mean: humans pick this up).
- `documentation` and `duplicate` have no canonical mapping — leave untouched.
- `/qualia-triage` should NOT overwrite repo-native labels — additive only.
