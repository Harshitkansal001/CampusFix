# CampusFix — NIT Hamirpur

Private campus issue reporting and resolution for NIT Hamirpur. Product requirements and stack decisions are in [PRD.md](PRD.md) and [TECH_STACK.md](TECH_STACK.md).

## Local setup

Requires Node.js 20.9 or newer and npm.

1. Install packages with `npm install`.
2. Start the local Supabase services with `npm run db:start` (requires Docker or another Docker-compatible runtime).
3. Copy `.env.example` to `.env.local` and set the local Supabase URL and publishable key printed by the CLI.
4. Start the app with `npm run dev` and open <http://localhost:3000>.

No hosted Supabase project or NITH SSO provider is configured yet. Do not add service-role keys to `NEXT_PUBLIC_*` variables or commit `.env.local`.

## Available commands

- `npm run dev` — local development server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run db:start` / `npm run db:stop` — local Supabase services
- `npm test` — Vitest unit tests
- `npm run test:e2e` — Playwright browser tests

Playwright browser binaries are installed separately when running browser tests with `npx playwright install`.
# CampusFix backend setup

The backend uses Supabase Auth, PostgreSQL, RLS, and private Storage. Apply `supabase/migrations/202610100001_campusfix_backend.sql` to a new Supabase project, then configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the app environment. Do not put a service-role key in the browser or app environment.

New users are reporters by default. A campus administrator must explicitly grant staff/admin roles and staff area memberships in the trusted Supabase SQL editor after verifying campus authorization; an email domain does not grant privileges. Review the seeded locations and categories with NITH before launch. Photo uploads use the private `report-photos` bucket, accept JPEG/PNG/WebP, and are limited to 5 MiB.

## API

- `GET /api/areas` and `GET /api/categories` return active lookup values.
- `GET /api/reports` returns reports allowed by the signed-in user's RLS scope.
- `POST /api/reports` accepts `{ "areaId": "uuid", "description": "...", "locationDetail": "..." }` and creates the report plus its initial audit event.
- `PATCH /api/reports/:id` accepts staff workflow fields: `status`, `priority`, `categoryId`, and `assignedTo`. Status transitions, scope, audit events, and notifications are enforced in PostgreSQL.
- `GET /api/notifications` lists the current user's notifications; `PATCH /api/notifications` accepts `{ "id": 1 }` to mark one read.

All routes require a Supabase Auth session except active lookup reads. Reports are private under RLS. AI suggestions and duplicate candidate tables are present for a future worker, but no AI processing or staff provisioning UI is configured yet.
