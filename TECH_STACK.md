# CampusFix for NIT Hamirpur — MVP tech stack

## Recommendation

| Area | Choice | Use |
|---|---|---|
| Web application | Next.js App Router + TypeScript | Reporter experience, staff dashboard, administrator pages, and server-side request handlers in one application. |
| UI | React with accessible, responsive components | Mobile-first reporting and desktop staff queue; keyboard and screen-reader support are required. |
| Backend/API | Next.js Route Handlers and server-only domain modules | Validate submissions, enforce access, update workflow, write history/notifications, and issue private photo upload permissions. |
| Database | Supabase-managed PostgreSQL | Relational report/workflow data, constraints, indexes, and Row Level Security (RLS). |
| Authentication | Supabase Auth with NITH-approved OIDC/SAML SSO when available | Campus identity and sessions. Confirm provider and provisioning with NITH IT before implementation; otherwise use an IT-approved email sign-in method. |
| Photo storage | Private Supabase Storage bucket | Optional report photos; authorized, short-lived access; server-side file validation. |
| Background jobs | Supabase Queues/Edge Functions or a small worker | AI triage and duplicate suggestions run after report persistence, with retries and idempotent processing. Choose the simplest option supported by deployment and queue guarantees. |
| AI provider | Provider selected after NITH privacy/procurement review | Suggest category, priority, uncertainty, and duplicate candidates. Provider call stays server-side; reports persist even when AI fails. |
| Testing | Vitest and Playwright | Unit checks for access/workflow rules and browser journeys for report submission and staff handling. Include database RLS checks before production. |
| Hosting | Vercel for Next.js; Supabase for database, auth, storage, and jobs | Keep app and data regions close; NITH must approve hosting, residency, procurement, backups, and retention. |

## NITH-specific data setup

- Seed `areas` with a parent-child campus directory: campus root, published NITH hostels/buildings/facilities, and later verified subareas.
- Keep area labels, active state, aliases, source, and any verified map coordinates editable by administrators. Do not hard-code area names into application logic.
- Seed a starter issue taxonomy, then have NITH facilities/operations approve the category names and priority policy before enabling AI triage.
- Store reporter identity as a Supabase Auth user ID. Add explicit staff memberships and area scopes; do not infer staff privileges from email domain.
- Store AI proposals separately from staff-final category and priority. Keep duplicate suggestions separate from staff-confirmed duplicate links.

## Request and processing flow

1. Browser authenticates with Supabase Auth and calls the Next.js application.
2. Server validates the session, payload, and reporter/staff permissions.
3. Report, initial event, and AI job are persisted; report submission returns without waiting for AI.
4. Worker processes triage and duplicate matching, validates provider output, and stores suggestions.
5. Staff requests are filtered by authorized area in server logic and protected again by PostgreSQL RLS.
6. A staff change, audit event, and resulting in-app notification are committed together.

## Security and operations requirements

- Enable RLS on every user-facing table and write policies for reporter ownership, staff role plus area scope, and administrator actions. Server checks are not a replacement for RLS.
- Use a user-scoped database client for ordinary requests. Keep service-role credentials only in trusted server/worker environments and never expose them to the browser.
- Keep photo storage private; enforce content type/size and use short-lived signed access.
- Validate AI output against active categories and the four permitted priorities. Treat output as untrusted suggestions.
- Avoid logging report descriptions/photos or sending unnecessary personal data to AI. Review provider retention and processing terms with NITH.
- Define job retry/failure handling, database backups, retention/deletion, monitoring ownership, and urgent-issue escalation before production.

## Decisions to confirm

NITH SSO and provisioning, approved hosting/data region, campus map/location source, photo limits, AI vendor and data terms, queue/runtime choice, retention rules, operational urgent-report coverage, and notification service expectations.

## Why this stack fits

It keeps the MVP in one web application while using PostgreSQL for relational workflow and access rules. Managed auth and storage avoid building those foundations from scratch. Background processing prevents an AI outage from blocking reports. The stack can later split workers or APIs out if traffic or campus integrations require it.
