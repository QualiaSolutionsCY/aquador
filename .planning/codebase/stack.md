# Tech Stack

## Runtime
- Node.js v20 (from `.nvmrc`)
- Package manager: npm (lockfile: `package-lock.json`)

## Framework
- Next.js 14.2.35 — App Router (`src/app/`)
- React 18

## Language
- TypeScript ^5 — `strict: true`, `moduleResolution: bundler`, path alias `@/*` → `src/*`

## Key libraries (grouped)

### UI / Styling
- tailwindcss ^3.4.1
- framer-motion ^12.27.1
- lucide-react ^0.562.0
- clsx ^2.1.1
- @react-three/fiber ^8.18.0, @react-three/drei ^9.122.0, three ^0.168.0 (3D)
- @tiptap/react ^3.19.0, @tiptap/starter-kit ^3.19.0, @tiptap/extension-underline ^3.19.0 (rich text)
- dompurify ^3.3.1 (HTML sanitization)

### State / Data
- React Context + useReducer (cart in `src/components/cart/CartProvider.tsx`)
- localStorage persistence (`aquador_cart`)
- react-hook-form ^7.71.1
- @hookform/resolvers ^5.2.2
- zod ^4.3.5

### Backend / Integrations
- @supabase/supabase-js ^2.91.0
- @supabase/ssr ^0.8.0
- stripe ^20.2.0 (server)
- @stripe/stripe-js ^8.6.3 (client)
- @sentry/nextjs ^10.40.0 — org `qualia-solutions`, project `aquador`, tunnel `/monitoring`
- @upstash/ratelimit ^2.0.8, @upstash/redis ^1.36.1
- @vercel/analytics ^1.6.1, @vercel/speed-insights ^1.3.1
- OpenRouter (REST, no SDK) — `src/app/api/ai-assistant/route.ts`
- Resend (REST, no SDK) — contact form

### Testing
- jest ^30.2.0, jest-environment-jsdom ^30.2.0
- @playwright/test ^1.57.0 — chromium/firefox/webkit + Mobile Chrome/Safari
- @testing-library/react ^16.3.2, @testing-library/jest-dom ^6.9.1, @testing-library/user-event ^14.6.1
- @types/jest ^30.0.0

## Database
- Supabase (Postgres) via `src/lib/supabase/` (client / server / public / admin)
- Tables: `products`, `admin_users`, `blog_posts`

## Hosting
- Vercel — project `aquador-next`
- Production: https://aquadorcy.com (custom domain)
- Preview: https://aquador-next.vercel.app

## CI / CD
- `.github/workflows/ci.yml` — lint, type-check, unit tests, E2E (chromium), build on push/PR to `main`
- `.github/workflows/deploy.yml` — Vercel production deploy + post-deploy smoke tests on push to `main`
- `.github/workflows/preview.yml` — Vercel preview deploy + PR comment on pull_request to `main`
- Vercel auto-deploy from GitHub: disabled by org policy; deploys driven by GitHub Actions (`deploy.yml`)

## MCP servers configured
- `supabase` — HTTP transport, `https://mcp.supabase.com/mcp` (from `.mcp.json`)

## Dev tools
- ESLint ^8 — extends `next/core-web-vitals`, `next/typescript`; ignores tests/e2e/scripts (`.eslintrc.json`)
- eslint-config-next 14.2.35
- postcss ^8
- tsx ^4.19.2 (script runner for `scripts/generate-ai-catalogue.ts`, `scripts/verify-indexes.ts`)
- @react-three/gltfjsx ^4.3.4 (3D asset tooling)
- No Husky / lint-staged configured
