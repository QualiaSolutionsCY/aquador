#!/usr/bin/env node
// bin/slop-detect.mjs — wrapper for scripts/design-laws-check.sh
// Rule 7b in qualia-plan-checker.md names this path; the canonical tool is the
// shell script. This wrapper delegates so both names resolve.
import { spawnSync } from 'node:child_process';
const args = process.argv.slice(2);
const result = spawnSync('bash', ['scripts/design-laws-check.sh', ...args], { stdio: 'inherit' });
process.exit(result.status ?? 1);
