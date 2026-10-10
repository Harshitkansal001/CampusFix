# CampusFix

CampusFix is a private campus issue reporting and resolution app for the National Institute of Technology Hamirpur (NIT Hamirpur). Students and staff can report campus issues, and authorized campus staff can review and update reports within their assigned areas.

## How it works

1. A reporter signs in and submits a campus area, issue description, and optional photo.
2. CampusFix saves the report as **New** and records its history.
3. Authorized staff review their area-scoped queue and update report status or priority.
4. Reporters can follow their reports and receive in-app notifications when status changes.

Current statuses are **New**, **Assigned**, **In progress**, **Resolved**, and **Reopened**. AI triage and duplicate suggestions are planned, but are not implemented yet. CampusFix is not an emergency service.

## Built with

- Next.js App Router, React, and TypeScript
- Supabase Auth, PostgreSQL, Row Level Security, and private Storage
- Vitest and Playwright

See [PRD.md](PRD.md) for product scope and open campus decisions, and [TECH_STACK.md](TECH_STACK.md) for the architecture and deployment requirements.

## Run locally

Requirements: Node.js 20.9 or newer, npm, and Docker (or a Docker-compatible runtime) for local Supabase.

```bash
npm install
npm run db:start
```

In a second terminal, run `npx supabase status` and copy the local API URL and anon key into `.env.local` using the variable names below. The anon key is a public client key; never use a service-role key in the app.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-local-anon-key
```

Then start the app:

```bash
npm run dev
```

Open <http://localhost:3000>. Local Supabase migrations are applied by the CLI. The local email inbox for sign-in links is available through Supabase Studio at <http://127.0.0.1:54323> (email capture runs on port 54324).

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Build the production app |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest tests |
| `npm run test:e2e` | Run Playwright browser tests |
| `npm run db:start` | Start local Supabase services |
| `npm run db:stop` | Stop local Supabase services |

Playwright browser binaries may need to be installed with `npx playwright install` before browser tests can run.

## Security and production readiness

- Reports are private to the reporter and authorized staff. Database access is protected with Row Level Security.
- Staff privileges must be explicitly granted by an administrator; an email domain alone does not grant access.
- Photos are stored in a private bucket. Never commit `.env.local` or expose service-role credentials.
- NIT Hamirpur must approve identity provider, staff provisioning, location data, photo policy, hosting, data residency, and operational procedures before launch.

The current implementation does not include an AI worker, staff provisioning interface, or hosted NITH SSO configuration.
