# Owner actions checklist (for client delivery)

This repo ships a demo slice (guest app + admin dashboard + backend + seeded Postgres schema). To make it production-ready and integrate PMS + digital keys, you will need the items below.

## Accounts and credentials to obtain

### PMS (pick the first target hotel + provider)
- Oracle Opera: decide if you will use a certified middleware partner; obtain sandbox credentials, base URL, resort/property identifiers, and allowed API scopes.
- Mews: enterprise ID, access token/client token, base URL, webhook registration details, and rate limit guidance.
- Cloudbeds: OAuth client ID/secret, property ID(s), base URL, sandbox environment access, and webhook/event support details.

### Digital keys
- Preferred: Alliants Digital Key.
- Required: sandbox + production credentials, property identifiers, lock vendor details per property (ASSA ABLOY/Vingcard, Salto, Dormakaba, etc.), and Apple/Google Wallet enablement steps (certificates/approvals if applicable).

### Payments (for tips, card holds, check-out)
- Choose PSP (Stripe vs Adyen) and request sandbox credentials.
- Confirm supported payment methods per region (Apple Pay/Google Pay/card) and required webhooks.

### Messaging and notifications
- SMS/email provider accounts (Twilio/MessageBird + Sendgrid/Mailgun, or a single provider).
- Sender IDs/domains, templates, and any required verification.

## Hotel onboarding data (per property)
- Branding assets: logo(s), accent color, hotel name, terms/privacy URLs.
- Supported languages for v1 (recommended to confirm `en`, `fr`, `es`).
- Module enablement + ordering (concierge, reception, housekeeping, spa, restaurants, room service, etc.).
- Service catalogs: room service menu, spa treatments, restaurants/availability rules (even as a first CSV export).
- Operational rules: SLA targets, concierge working hours, escalation contacts.

## Infrastructure and security decisions
- Hosting: where frontend/admin/backend will run (domain names + TLS certificates).
- Secrets management: where you will store PMS/keys/payments credentials (never commit them).
- Data compliance: retention policy for ID docs, audit log requirements, GDPR/DPAs.
- Observability: logs/metrics/error tracking (Sentry, OpenTelemetry, etc.).

## How to run the current demo locally
- Ensure Postgres is running and the database exists (defaults: db `mystay`, user `postgres`, password `postgres`).
- Copy env files:
  - `backend/.env.example` → `backend/.env`
  - `frontend/.env.example` → `frontend/.env`
  - `admin/.env.example` → `admin/.env`
- Reset and seed DB (drops schema): `npm run db:reset`
- Run everything (recommended): `./dev.sh --reset-db` (starts backend + worker + guest + admin)
- Admin login (seeded): email `admin@mystay.local`, password `admin123`
- Configure providers in admin: open `http://localhost:3001/integrations`

## Suggested next development milestones
- Harden auth + RBAC (rate limits, password reset, audit logs, staff onboarding UI).
- Implement PMS connector interface, then a first real connector (recommended: Mews or Cloudbeds before Opera).
- Implement digital key issuance flow gated by check-in validation (ID + payment hold).
- Add migrations tooling (Prisma/Drizzle) on top of Postgres and prepare a managed Postgres environment.
- Add file upload service for ID documents (secure storage + audit logs).
- Add payments/tips flow end-to-end (PSP intents + webhook handling + posting to folio when required).
