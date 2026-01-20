# Architecture Overview

## Context
- Guest-facing PWA with digital check-in/out, agenda, concierge chat, housekeeping requests, room service ordering, spa/gym bookings, restaurant reservations, and notifications.
- Staff consoles per department (concierge, reception, housekeeping, spa, F&B) with routing, assignments, and service SLAs; management analytics for KPIs and sentiment.
- Payments and compliance: ID capture, signatures, card holds/tips, audit logs, localization.

## Stack & Standards
- Guest PWA: Next.js 14 App Router (in `frontend/`) with TypeScript, Tailwind, and shadcn-style UI primitives.
- Admin dashboard: Next.js 14 App Router (in `admin/`) with Tailwind.
- Backend: minimal Node server (in `backend/`) with Postgres for persistence, auth (guest + staff tokens), and Postgres NOTIFY for realtime events (SSE).
- Worker: Node outbox worker for notifications (email/SMS/push) using per-hotel provider configuration.
- Repo: npm workspaces (`frontend`, `admin`, `backend`) for one-command installs and consistent tooling.
- State/data: ready for React Query or server actions once APIs/PMS connectors are available; prefers schema validation via Zod.
- Testing: Vitest with Testing Library; `npm test` runs unit/integration suites (jsdom).
- Linting: ESLint `next/core-web-vitals`; path alias `@/*` rooted at each app’s `src/`.

## Project Structure
- `frontend/src/app/(experience)/`: guest routes with a shared shell; stubs for agenda, concierge, housekeeping, room-service, spa-gym, restaurants, messages, profile, operations, and analytics.
- `frontend/src/components/`: guest layout shell, navigation, page headers, and UI primitives.
- `frontend/src/lib/`: guest navigation config and utilities (`cn`).
- `frontend/src/tests/`: Vitest setup and starter tests.
- `admin/src/app/`: admin dashboard routes (staff + managers).
- `backend/src/`: API server (tickets/threads/events/invoices), realtime (SSE), integrations config, notifications config.
- `backend/db/`: Postgres schema + seed SQL.
- `doc/`: documentation (this file); contributor guidelines live in `AGENTS.md`.

## Module Notes (aligned to requirements)
- Check-in/out: capture ID, signatures, payment holds, and activate/deactivate digital keys; surface compliance states in the overview.
- Agenda: unified calendar across spa, dining, transfers, housekeeping tasks; reminders and upsell invitations.
- Concierge: chat with quick actions, AI fallback for off-hours, confirmations with attachments.
- Housekeeping: stay-level toggle, quick item requests, status timeline; staff board with assignments and SLAs.
- Room Service: menu with allergens, modifiers, payments, and delivery milestones; kitchen board and surge handling.
- Spa/Gym: slot booking with practitioner/room capacity, confirmations, reminders, post-visit feedback/tips.
- Restaurants: menus, allergens, table booking, chat for adjustments, waitlist, and pacing controls.
- Messaging: single inbox with tags, statuses, and internal notes; department-scoped visibility.
- Analytics: response SLAs, revenue attribution, satisfaction trends, capacity forecasts.

## Local development
- One command: `./dev.sh --reset-db` (or `npm run dev:all -- --reset-db`) starts backend + notifications worker + frontend + admin.
- Postgres is required; backend uses `DATABASE_URL` from `backend/.env`.

## Internationalization
- Next.js i18n configured for `en`, `fr`, `es` (`frontend/next.config.mjs` and `admin/next.config.mjs`).
- Locale helpers in `frontend/src/lib/i18n/locales.ts`; add dictionaries once copy is ready. Use locale-aware routing for pages and content once translations land.

## Next Steps
- Wire real data sources (PMS, payments, notifications) behind typed client hooks and backend routes.
- Add auth/session handling for guests vs. staff roles and feature flagging for hotels.
- Extend UI components as design files arrive; keep additions in `frontend/src/components/ui` with tokens in Tailwind theme.
- Introduce translations and locale switcher once copy is available; default locale is `en`.
