# Setup & Commands

## Prerequisites
- Node.js 18+ and npm (or pnpm/yarn if preferred).
- Postgres running locally (or a `DATABASE_URL` to a dev database).
- Install dependencies: `npm install` (generates a lockfile); run from repo root.

## Quick start (local)
1) Copy env files (see below)  
2) Run everything: `./dev.sh --reset-db` (or `npm run dev:all -- --reset-db`)

## Commands
- `./dev.sh` — run migrate/seed + start backend/frontend/admin together (Ctrl+C to stop).
- `npm run dev` — start the guest PWA (Next.js) from `frontend/`.
- `npm run dev:all` — same as `./dev.sh`.
- `npm run dev:admin` — start the admin dashboard (Next.js) from `admin/` on port 3001.
- `npm run dev:backend` — start the backend API stub (Node) on port 4000.
- `npm run dev:worker:notifications` — start the notifications outbox worker (Node).
- `npm run worker:notifications` — run the notifications worker once (no watch).
- `npm run db:generate -- --name <label>` — generate a new migration from `backend/src/db/drizzle/schema.ts`.
- `npm run db:reset` — drop + recreate Postgres schema, then seed demo data (dev only).
- `npm run build` / `npm run start` — build/start the guest PWA from `frontend/`.
- `npm run build:admin` / `npm run start:admin` — build/start the admin dashboard from `admin/`.
- `npm run lint` — lint the guest PWA (`frontend/`).
- `npm run lint:admin` — lint the admin dashboard (`admin/`).
- `npm test` — Vitest for the guest PWA; suites live under `frontend/src/tests/`.

## Demo credentials (seeded)
- Guest check-in: confirmation number `0123456789`.
- Admin login: email `admin@mystay.local`, password `admin123`.

## Environment
- Copy env examples per app:
  - `frontend/.env.example` → `frontend/.env`
  - `admin/.env.example` → `admin/.env`
  - `backend/.env.example` → `backend/.env`
- Keep secrets out of git; rotate PMS tokens regularly and use per-hotel configuration.

## UI Components (shadcn style)
- Reuse primitives in `frontend/src/components/ui` (button, card, badge, avatar, separator).
- Add new primitives under `frontend/src/components/ui` and keep tokens in `frontend/tailwind.config.ts` so future designs map cleanly.

## Structure Reminders
- Guest pages live in `frontend/src/app/(experience)/` with the shared shell.
- Admin pages live in `admin/src/app/`.
- Shared layout/navigation (guest) lives in `frontend/src/components/layout` and `frontend/src/components/navigation`.
- Domain-specific data/config (guest) belongs in `frontend/src/lib/`; keep services typed and composable once APIs are added.
