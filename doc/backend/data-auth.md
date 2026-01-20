# Data & Auth Plan

## Database
- Current implementation uses Postgres (configured via `DATABASE_URL`).
- Use a migration-friendly ORM (Prisma or Drizzle) with CI migrations; seed data per hotel for local testing.
- Core tables: `hotels`, `guests`, `staff_users`, `stays/reservations`, `rooms`, `messages`, `tasks`, `charges`, `audit_events`, `feature_flags`.
- Multi-tenant: scope all queries by `hotel_id`; enforce row-level security if using managed Postgres.

## Auth
- Current implementation uses signed tokens (`AUTH_SECRET`) for guests and staff:
  - Guest token is issued by `/api/v1/stays/lookup` and scopes access to the stay + hotel.
  - Staff token is issued by `/api/v1/auth/staff/login` and scopes access to one hotel + role.
- Roles: `guest`, `staff`, `manager`, `admin`; permissions per department (concierge, housekeeping, spa, F&B).
- Store password hashes with modern hashing; current demo uses `scrypt$...` hashes for seeded `staff_users`.
- Keep `AUTH_SECRET` in `.env`; rotate tokens; short-lived access tokens with refresh flow for apps.

## Security & Compliance
- Do not store payment PANs; rely on PSP tokens. Encrypt PII at rest; redact in logs.
- Audit events for ID capture, signatures, payments, and key activations. Make audit queries available to ops/compliance.
- Rate-limit auth endpoints; add bot protection for login/signup/check-in flows.

## Implementation Steps
1) Select ORM and create initial schema + migrations.  
2) Implement auth provider with role-based access checks at route and component level.  
3) Wire PMS-linked reservation lookup to grant guests access to their stay; cache minimal data.  
4) Add feature flags per hotel to toggle modules (keys, chat AI, payments) safely.  
5) Add tests for auth flows, RBAC guards, and audit logging.
