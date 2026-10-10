# CampusFix — NIT Hamirpur

Private campus issue reporting and resolution for NIT Hamirpur. Product requirements and stack decisions are in [PRD.md](PRD.md) and [TECH_STACK.md](TECH_STACK.md).

## Local setup

Requires Node.js 20.9 or newer and npm.

1. Install packages with `npm install`.
2. Copy `.env.example` to `.env.local` and add the Supabase project URL and publishable key.
3. Start the app with `npm run dev` and open <http://localhost:3000>.

The Supabase project and NITH SSO provider are not connected yet. Do not add service-role keys to `NEXT_PUBLIC_*` variables or commit `.env.local`.

## Available commands

- `npm run dev` — local development server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm test` — Vitest unit tests
- `npm run test:e2e` — Playwright browser tests

Playwright browser binaries are installed separately when running browser tests with `npx playwright install`.
