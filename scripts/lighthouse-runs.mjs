#!/usr/bin/env node
/**
 * Lighthouse runs for Milestone 4 Phase 3 T2.
 *
 * - Boots `npm run dev` as a child process.
 * - Waits for http://localhost:3000 to respond.
 * - Runs Lighthouse v13 (performance + accessibility) against 4 routes x 2 viewports.
 * - Writes a Markdown table to .planning/archive/milestone-4-handoff/lighthouse-scores.md
 *   even on failure, so deltas are debuggable.
 * - Exits 0 only when all 8 rows pass the thresholds.
 *
 * Run: `npm run lighthouse`
 */

import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import lighthouse from 'lighthouse';
import { launch as launchChrome } from 'chrome-launcher';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, '.planning', 'archive', 'milestone-4-handoff');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'lighthouse-scores.md');
const DEV_URL = 'http://localhost:3000';
const DEV_PORT = 3000;
const BOOT_TIMEOUT_MS = 120_000;
const FALLBACK_SLUG = 'lattafa-yara';

// ---------------- Thresholds (per task spec) ----------------
const THRESHOLDS = {
  performance: 0.9,
  accessibility: 0.9,
  lcpMobileMaxMs: 2500,
  clsMax: 0.1,
  tbtDesktopMaxMs: 200,
};

// ---------------- Viewports ----------------
const VIEWPORTS = {
  mobile: {
    label: 'mobile',
    formFactor: 'mobile',
    screenEmulation: {
      mobile: true,
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
      disabled: false,
    },
  },
  desktop: {
    label: 'desktop',
    formFactor: 'desktop',
    screenEmulation: {
      mobile: false,
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      disabled: false,
    },
  },
};

// ---------------- .env.local loader ----------------
function loadEnvLocal() {
  const envPath = path.join(PROJECT_ROOT, '.env.local');
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

// ---------------- Supabase: pick a PDP slug ----------------
async function pickPdpSlug() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    console.warn(`[slug] Supabase env vars missing, falling back to '${FALLBACK_SLUG}'`);
    return FALLBACK_SLUG;
  }
  try {
    const supabase = createClient(url, anon, {
      auth: { persistSession: false },
    });
    const { data, error } = await supabase
      .from('products')
      .select('slug')
      .eq('in_stock', true)
      .limit(1)
      .single();
    if (error || !data?.slug) {
      console.warn(
        `[slug] Supabase query failed (${error?.message ?? 'no row'}), falling back to '${FALLBACK_SLUG}'`,
      );
      return FALLBACK_SLUG;
    }
    return data.slug;
  } catch (err) {
    console.warn(
      `[slug] Supabase client error (${err?.message ?? err}), falling back to '${FALLBACK_SLUG}'`,
    );
    return FALLBACK_SLUG;
  }
}

// ---------------- Dev server boot + wait ----------------
function startDevServer() {
  const child = spawn('npm', ['run', 'dev'], {
    cwd: PROJECT_ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PORT: String(DEV_PORT) },
    detached: false,
  });
  child.stdout.on('data', (chunk) => {
    // Mirror dev server boot lines so failures surface in the operator log.
    const text = chunk.toString();
    if (
      text.includes('Ready') ||
      text.includes('error') ||
      text.includes('Error') ||
      text.includes('compiled')
    ) {
      process.stdout.write(`[dev] ${text}`);
    }
  });
  child.stderr.on('data', (chunk) => {
    process.stderr.write(`[dev:err] ${chunk.toString()}`);
  });
  child.on('exit', (code, signal) => {
    if (code !== null && code !== 0) {
      console.error(`[dev] exited with code ${code}`);
    } else if (signal) {
      console.log(`[dev] terminated by signal ${signal}`);
    }
  });
  return child;
}

function pingOnce(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      // Any HTTP response (2xx/3xx/4xx) means the server is up.
      res.resume();
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(url, timeoutMs) {
  const start = Date.now();
  let attempt = 0;
  while (Date.now() - start < timeoutMs) {
    attempt += 1;
    const up = await pingOnce(url);
    if (up) {
      console.log(`[boot] dev server ready after ${attempt} attempt(s) in ${Date.now() - start}ms`);
      // Small grace period for compilation of the first route.
      await new Promise((r) => setTimeout(r, 1500));
      return;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Dev server did not respond at ${url} within ${timeoutMs}ms`);
}

function killDevServer(child) {
  if (!child || child.killed) return;
  try {
    child.kill('SIGTERM');
  } catch (err) {
    console.warn(`[dev] SIGTERM failed: ${err?.message ?? err}`);
  }
  // Hard kill fallback in 5s if SIGTERM didn't take.
  setTimeout(() => {
    if (!child.killed) {
      try {
        child.kill('SIGKILL');
      } catch {
        // already gone
      }
    }
  }, 5000).unref();
}

// ---------------- One Lighthouse run ----------------
async function runOne(url, viewport) {
  const chrome = await launchChrome({
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
  });
  try {
    const flags = {
      port: chrome.port,
      output: 'json',
      logLevel: 'error',
      onlyCategories: ['performance', 'accessibility'],
    };
    const config = {
      extends: 'lighthouse:default',
      settings: {
        formFactor: viewport.formFactor,
        screenEmulation: viewport.screenEmulation,
        // Keep throttling defaults per form factor so scores reflect what
        // Lighthouse Web reports for mobile/desktop runs.
      },
    };
    const result = await lighthouse(url, flags, config);
    if (!result || !result.lhr) {
      throw new Error(`Lighthouse returned no result for ${url}`);
    }
    return result.lhr;
  } finally {
    try {
      const maybe = chrome.kill();
      if (maybe && typeof maybe.then === 'function') await maybe;
    } catch {
      // best-effort cleanup
    }
  }
}

function extract(lhr) {
  const perf = lhr.categories?.performance?.score ?? null;
  const a11y = lhr.categories?.accessibility?.score ?? null;
  const lcp = lhr.audits?.['largest-contentful-paint']?.numericValue ?? null;
  const cls = lhr.audits?.['cumulative-layout-shift']?.numericValue ?? null;
  const tbt = lhr.audits?.['total-blocking-time']?.numericValue ?? null;
  const runtimeError = lhr.runtimeError?.message ?? null;
  return { perf, a11y, lcp, cls, tbt, runtimeError };
}

function evaluateRow({ viewportLabel, perf, a11y, lcp, cls, tbt }) {
  const reasons = [];
  if (perf === null || perf < THRESHOLDS.performance) {
    reasons.push(`performance ${perf ?? 'null'} < ${THRESHOLDS.performance}`);
  }
  if (a11y === null || a11y < THRESHOLDS.accessibility) {
    reasons.push(`accessibility ${a11y ?? 'null'} < ${THRESHOLDS.accessibility}`);
  }
  if (cls === null || cls > THRESHOLDS.clsMax) {
    reasons.push(`cls ${cls ?? 'null'} > ${THRESHOLDS.clsMax}`);
  }
  if (viewportLabel === 'mobile' && (lcp === null || lcp > THRESHOLDS.lcpMobileMaxMs)) {
    reasons.push(`lcp ${lcp ?? 'null'}ms > ${THRESHOLDS.lcpMobileMaxMs}ms (mobile)`);
  }
  if (viewportLabel === 'desktop' && (tbt === null || tbt > THRESHOLDS.tbtDesktopMaxMs)) {
    reasons.push(`tbt ${tbt ?? 'null'}ms > ${THRESHOLDS.tbtDesktopMaxMs}ms (desktop)`);
  }
  return { pass: reasons.length === 0, reasons };
}

function fmtScore(s) {
  return s === null ? 'n/a' : (s * 100).toFixed(0);
}
function fmtMs(v) {
  return v === null ? 'n/a' : Math.round(v).toString();
}
function fmtCls(v) {
  return v === null ? 'n/a' : v.toFixed(3);
}

function writeMarkdown(rows, slug) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const generated = new Date().toISOString();
  const lines = [];
  lines.push('# Lighthouse scores — Milestone 4 Phase 3 T2');
  lines.push('');
  lines.push(`Generated: ${generated}`);
  lines.push(`Command: node scripts/lighthouse-runs.mjs`);
  lines.push('');
  lines.push(
    `Thresholds: Performance >= ${THRESHOLDS.performance} and Accessibility >= ${THRESHOLDS.accessibility} on all 8 rows; ` +
      `LCP <= ${THRESHOLDS.lcpMobileMaxMs}ms on mobile rows; CLS <= ${THRESHOLDS.clsMax} on all 8 rows; ` +
      `TBT <= ${THRESHOLDS.tbtDesktopMaxMs}ms on desktop rows.`,
  );
  lines.push('');
  lines.push(`PDP slug used: \`${slug}\``);
  lines.push('');
  lines.push(
    'Note: numbers below are from `npm run dev` (uncompiled, unminified). Production-build scores via ' +
      '`next build && next start` will be substantially higher; treat these as a regression baseline only.',
  );
  lines.push('');
  lines.push('| Route | Viewport | Performance | Accessibility | LCP (ms) | CLS | TBT (ms) | Pass |');
  lines.push('|---|---|---|---|---|---|---|---|');
  for (const r of rows) {
    lines.push(
      `| ${r.route} | ${r.viewport} | ${fmtScore(r.perf)} | ${fmtScore(r.a11y)} | ${fmtMs(r.lcp)} | ${fmtCls(r.cls)} | ${fmtMs(r.tbt)} | ${r.pass ? 'yes' : 'no'} |`,
    );
  }
  lines.push('');
  const failures = rows.filter((r) => !r.pass);
  if (failures.length > 0) {
    lines.push('## Failures');
    lines.push('');
    for (const f of failures) {
      lines.push(`- \`${f.route}\` @ ${f.viewport}: ${f.reasons.join('; ')}`);
    }
    lines.push('');
  } else {
    lines.push('All 8 rows pass thresholds.');
    lines.push('');
  }
  fs.writeFileSync(OUTPUT_FILE, lines.join('\n'), 'utf8');
  console.log(`[md] wrote ${OUTPUT_FILE}`);
}

// ---------------- Main ----------------
async function main() {
  loadEnvLocal();
  const slug = await pickPdpSlug();
  const routes = [
    { label: '/', path: '/' },
    { label: `/products/${slug}`, path: `/products/${slug}` },
    { label: '/shop', path: '/shop' },
    { label: '/cart', path: '/cart' },
  ];

  // If a dev server is already serving :3000 (operator's foreground server),
  // reuse it rather than spawn a duplicate that will fight for the port.
  const alreadyUp = await pingOnce(DEV_URL);
  let dev = null;
  if (alreadyUp) {
    console.log('[boot] reusing existing server on :3000 (will not spawn or kill it)');
  } else {
    console.log('[boot] starting dev server...');
    dev = startDevServer();
  }

  // Pre-warm rows so the markdown is always writable even on early failure.
  const rows = [];
  for (const route of routes) {
    for (const vp of ['mobile', 'desktop']) {
      rows.push({
        route: route.label,
        viewport: vp,
        perf: null,
        a11y: null,
        lcp: null,
        cls: null,
        tbt: null,
        pass: false,
        reasons: ['not run'],
      });
    }
  }

  try {
    await waitForServer(DEV_URL, BOOT_TIMEOUT_MS);

    let rowIdx = 0;
    for (const route of routes) {
      for (const vpKey of ['mobile', 'desktop']) {
        const viewport = VIEWPORTS[vpKey];
        const url = `${DEV_URL}${route.path}`;
        console.log(`[run ${rowIdx + 1}/8] ${url} @ ${vpKey}`);
        try {
          const lhr = await runOne(url, viewport);
          const m = extract(lhr);
          const verdict = evaluateRow({
            viewportLabel: vpKey,
            perf: m.perf,
            a11y: m.a11y,
            lcp: m.lcp,
            cls: m.cls,
            tbt: m.tbt,
          });
          rows[rowIdx] = {
            route: route.label,
            viewport: vpKey,
            perf: m.perf,
            a11y: m.a11y,
            lcp: m.lcp,
            cls: m.cls,
            tbt: m.tbt,
            pass: verdict.pass,
            reasons: m.runtimeError
              ? [...verdict.reasons, `lighthouse runtimeError: ${m.runtimeError}`]
              : verdict.reasons,
          };
          console.log(
            `  perf=${fmtScore(m.perf)} a11y=${fmtScore(m.a11y)} lcp=${fmtMs(m.lcp)}ms cls=${fmtCls(m.cls)} tbt=${fmtMs(m.tbt)}ms -> ${verdict.pass ? 'PASS' : 'FAIL: ' + verdict.reasons.join(', ')}`,
          );
        } catch (err) {
          console.error(`  ERROR: ${err?.message ?? err}`);
          rows[rowIdx] = {
            route: route.label,
            viewport: vpKey,
            perf: null,
            a11y: null,
            lcp: null,
            cls: null,
            tbt: null,
            pass: false,
            reasons: [`run error: ${err?.message ?? err}`],
          };
        }
        rowIdx += 1;
      }
    }
  } catch (err) {
    console.error(`[boot] FATAL: ${err?.message ?? err}`);
  } finally {
    writeMarkdown(rows, slug);
    if (dev) killDevServer(dev);
  }

  const failures = rows.filter((r) => !r.pass);
  if (failures.length > 0) {
    console.error(`\n${failures.length}/8 rows failed thresholds:`);
    for (const f of failures) {
      console.error(`  - ${f.route} @ ${f.viewport}: ${f.reasons.join('; ')}`);
    }
    process.exit(1);
  }
  console.log('\nAll 8 rows passed.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
