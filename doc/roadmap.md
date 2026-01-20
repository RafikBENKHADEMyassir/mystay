# Delivery Roadmap

## Phase 0 — Foundation (done)
- Next.js 14 + TypeScript + Tailwind + shadcn-style UI primitives; navigation shell and domain route stubs.
- Linting (ESLint), testing (Vitest + Testing Library), path aliases, and `.env.example`.
- Docs for setup, architecture, and PMS integration.

## Phase 1 — Core Platform
- Auth & sessions: implemented guest + staff tokens backed by Postgres; next add refresh/password reset + richer RBAC UI.
- Database schema: bookings, guests, staff, messages, tasks, charges, audit logs. Prefer migration-friendly tooling (Prisma/Drizzle) and seed data.
- Localization: add dictionaries for `en`, `fr`, `es`; locale switcher; translate navigation and labels.
- Theming: finalize tokens from design handoff; keep primitives in `frontend/src/components/ui`.

## Phase 2 — PMS & Payments
- Build PMS connector layer (`backend/src/pms/*`) per `doc/backend/pms-integration.md`; support Opera (via middleware), Mews, Cloudbeds. Add reconciler + health checks.
- Digital check-in/out: ID capture, signatures, payment holds, status updates, digital key activation/deactivation.
- Payments: integrate PSP (Stripe/Adyen) for holds, charges, refunds, and tips with folio posting to PMS.

## Phase 3 — Guest Experience Features
- Agenda: unified calendar with PMS sync, upsell invitations, reminders, and cancellations.
- Concierge/Messaging: threaded inbox, statuses, internal notes, multilingual responses, SLAs, and macros.
- Housekeeping: guest toggles + quick requests; staff board with assignments and timing alerts.
- Room Service/Restaurants/Spa-Gym: menus with allergens, modifiers, availability, waitlists, delivery/booking timelines.

## Phase 4 — Operations & Analytics
- Staff consoles per department with role-scoped visibility and workflow automation.
- Analytics: KPIs (response SLAs, revenue attribution, satisfaction), sentiment, capacity forecasts.
- Observability: metrics, structured logs, tracing, and alerting for PMS/PSP connectors and queues.

## Cross-Cutting Practices
- Security: secret management, audit trails for ID/payment, PII minimization, per-hotel feature flags.
- Performance: cache PMS reads where allowed; debounce writes; use background jobs for heavy sync.
- Testing: unit + integration + contract tests for connectors; e2e for critical guest flows (check-in, payments, messaging).
