# Owner checklist (run locally)

## Prerequisites
- Node.js 20+ and npm
- Postgres running locally with:
  - DB: `mystay`
  - user: `postgres`
  - password: `postgres`
  - host/port: `localhost:5432`

## One-time setup
- Install deps at repo root: `npm install`
- Create env files (or verify they exist):
  - `cp backend/.env.example backend/.env`
  - `cp frontend/.env.example frontend/.env`
  - `cp admin/.env.example admin/.env`
- Confirm `backend/.env` has `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mystay`

## Start everything (dev mode)
- Full reset + seed (recommended after schema changes): `./dev.sh --reset-db`
- Normal start (keeps existing DB): `./dev.sh`

## URLs + demo credentials
- Guest app:
  - EN: `http://localhost:3000/en`
  - FR: `http://localhost:3000/fr`
  - Check-in (dev default confirmation auto-loads): `http://localhost:3000/fr/reception/check-in`
- Admin dashboard:
  - `http://localhost:3001/login`
  - Demo login: `admin@mystay.local` / `admin123`
- Backend:
  - Health: `http://localhost:4000/health`

## Quick sanity checks
- Guest: open `/fr`, complete check-in, then open Services + Messages and send a message.
- Admin: open Inbox ticket and Messages thread; verify assignment + internal notes; verify live refresh when new guest messages arrive.

## If something breaks
- `/fr` is 404: restart the frontend dev server; make sure `frontend/src/middleware.ts` exists (Next only picks up middleware from `src/` or repo root).
- DB errors: rerun `./dev.sh --reset-db`.
- CORS/auth errors: verify `CORS_ORIGINS` in `backend/.env` includes `http://localhost:3000,http://localhost:3001`.

## Suggested next build steps
- Auth hardening + RBAC: staff/admin roles, hotel scoping, staff management UI.
- Notifications delivery: implement Sendgrid/Twilio/FCM providers + delivery receipts/webhooks on top of the outbox.
- Integrations: ship 1 real PMS connector (keep `mock` as fallback) + digital key issuance workflow.
- Guest UI: quick-action chips row in chat, history/invoices screen, tip bottom sheet, and backend persistence for check-in artifacts (ID upload, extras).
