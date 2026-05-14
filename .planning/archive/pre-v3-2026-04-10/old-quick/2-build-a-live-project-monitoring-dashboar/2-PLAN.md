# Plan: 002 — Live Project Monitoring Dashboard with 3D Visuals

**Mode:** quick
**Created:** 2026-03-05

## Task 1: Scaffold Next.js project with React Three Fiber

**What:** Create a new project `qualia-monitor` at `/home/qualia/Projects/live/qualia-monitor` with Next.js 16, React Three Fiber, Three.js, and Tailwind v4. Define all 13 project configs with URLs and Supabase refs.
**Files:** New project scaffold
**Done when:** `npm run dev` starts without errors

## Task 2: Build health check API + 3D visualization

**What:** API route that pings all project URLs and Supabase instances for health. 3D scene with React Three Fiber showing each project as a glowing holographic block — color-coded by health, floating in a dark void with stars, bloom effects, and ambient particles. Glass-morphism overlay with aggregate stats.
**Files:** `src/app/api/check/route.ts`, `src/app/page.tsx`, `src/components/*`
**Done when:** Dashboard renders 3D scene with live health data, auto-refreshes every 30s

## Task 3: Polish and run

**What:** Post-processing effects (bloom, chromatic aberration), camera orbit controls, hover/click interactions on blocks, responsive layout. Start dev server and verify.
**Files:** `src/components/Scene.tsx`, `src/app/globals.css`
**Done when:** Visually impressive, runs locally, ready for Vercel deploy
