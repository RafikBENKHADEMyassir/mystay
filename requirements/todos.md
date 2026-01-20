# Small TODOs (prioritized)

## Gap Analysis - Missing Features from Arborescence (High Priority)
### Guest App (Frontend)
- [ ] **Concierge Module**: Implement chat interface + quick actions (Taxi, Transfer, Tickets) per User Story 4.
- [ ] **Housekeeping Module**: Implement simplified request flow (Icons for towels, amenities) + chat per User Story 6.
- [ ] **Room Service Module**: Implement "Uber Eats" style menu, cart, order tracking, and chat per User Story 7.
- [ ] **Spa & Gym Module**: Implement Service Catalog (sync with Spa Booker), Booking flow, and Coach booking per User Story 8 & 10.
- [ ] **Restaurant Module**: Implement Menu display, Table booking flow per User Story 9.
- [ ] **Agenda Intelligent**: Implement unified view of all bookings (Spa, Dinner, etc.) + Hotel Events per User Story 11.

### Staff App (Admin)
- [ ] **Reception Dashboard**: Dedicated view for Check-in/out status, room status, and live arrivals/departures (User Story 2 & 5).
- [ ] **Housekeeping Dashboard**: "Housekeeping Board" with room grid (Ready/Cleaning/Dirty) and task assignment (User Story 6).
- [ ] **F&B Manager Dashboard**: Menu management, Order tracking (Prep/Delivery), Table reservations (User Story 7 & 9).
- [ ] **Wellness Manager Dashboard**: Spa/Gym calendar view, Practitioner scheduling (User Story 8 & 10).
- [ ] **Concierge Hub**: Enhanced dashboard with quick booking tools and "Concierge on duty" logic (User Story 4).

### Backend Integrations
- [ ] **F&B Integration**: Connect to Restaurant POS/Booking system (OpenTable/SevenRooms or generic) for table/order sync.
- [ ] **Spa Integration**: Connect to "Spa Booker" or similar for service catalog and availability sync.

## Current demo slice (already implemented)
- Monorepo folders: `frontend/` (guest app), `admin/` (dashboard), `backend/` (API + Postgres).
- Drizzle migrations + seeded Postgres schema + reset scripts: `npm run db:reset`.
- Backend endpoints (DB-backed): stays lookup, tickets (list + detail + status updates), threads/messages, events, invoices, analytics summary.
- Auth: guest token issued on stay lookup; admin login via seeded `staff_users` (cookie session in admin app).
- Realtime: Postgres NOTIFY → SSE for message threads + hotel-wide admin stream (auto-refresh inbox).
- Admin can configure per-hotel PMS + digital key provider settings at `/integrations` (still config-only; no live vendor calls yet).
- Notifications: per-hotel provider config + outbox worker + automatic enqueue on ticket/thread/message events + test enqueue UI at `/integrations`.
- Admin inbox: ticket list + filters + ticket detail page with status updates, assignment controls, and internal notes (live refresh on create/update/notes).
- Admin messages: threads list + thread detail chat with realtime refresh, assignment controls, and internal notes.
- Guest app: locale routing `/en` + `/fr`, topbar aligned to `doc/client_docs/design/topbar.png`, 4-tab bottom nav, recap home, services list, messages list + chat UI.

## Open questions to confirm (fast)
- Guest access model: PWA-only (email/SMS link) vs native app download also required.
- Reservation link: confirmation number only, or + last name / phone for verification?
- Digital key scope: wallet-only (Alliants) vs in-app key fallback.
- Messaging SLA targets per department and working hours (AI fallback rules).
- Multilingual: which languages are required for v1 (brief mentions `en`, `fr`, `es`)?

## P0 — Define contracts (unblocks everything)
- Define core entities + IDs: `hotel`, `stay/reservation`, `guest`, `staff_user`, `thread`, `message`, `ticket`, `invoice`, `tip`.
- Formalize the current API contracts (request/response shapes) and lock them before implementing real PMS + digital key connectors.
- Decide URL + layout split: guest routes vs `/admin/*` dashboard routes.

## P1 — Frontend (guest)
- Add quick-action chips row (transfer, transport, etc.) in chat per `doc/client_docs/design/body messages concierge.png`.
- Add Tip bottom sheet component per `doc/client_docs/design/bottom-sheet tip.png` (UI only).
- Add Profile → History/Invoices screen per `doc/client_docs/design/body history.png` (UI only).
- Add Reception → Check-in step screen polish: wire to backend (persist identity + extras) and add payment hold placeholder.

## P1 — Admin dashboard (staff + managers)
- Add hotel settings screens (branding, module ordering, language defaults) and wire them to DB.
- Add basic analytics cards skeleton (volume, SLA, revenue attribution placeholders).
- Show assignee + department badges in inbox/messages lists; add “Only mine” filter.

## P2 — Backend foundation (minimal vertical slice)
- Harden auth:
  - Refresh tokens + password reset.
  - Rate limiting for login/lookup endpoints.
  - Staff onboarding/management UI in admin (create/disable users, rotate secrets).
- Implement reservation lookup against the configured PMS provider per hotel (keep `mock` as fallback).
- Implement file upload plumbing for ID documents (store + audit log entry; no OCR yet).

## P3 — Integrations (incremental)
- PMS connector interface + one real connector spike (choose first target: Opera via middleware, Mews, or Cloudbeds).
- Digital key connector interface + first real connector (recommended: Alliants).
- Payments/tips:
  - PSP integration decision (Stripe vs Adyen).
  - Card hold + tip flow (tokenized; no PAN storage).
- Notifications:
  - Add the event triggers that enqueue notifications (reservation created, ticket status updates, message mentions).
  - Add delivery receipts + provider webhooks where available (Twilio status callbacks, Sendgrid events, etc.).

## Docs hygiene
- Keep `doc/client_docs/` as raw source; keep working notes in `requirements/` and `doc/*`.
- Add a short “MVP slice” section to `doc/roadmap.md` once the first hotel/pilot scope is agreed.
