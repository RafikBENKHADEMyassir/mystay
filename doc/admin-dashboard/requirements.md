# Admin dashboard requirements (staff + management)

This is a working spec distilled from:
- `doc/client_docs/App MySTAY (1).pdf` (staff interface sections)
- `doc/client_docs/Experience client Mystay (1).txt` (department dashboards)
- `requirements/module-checklist.md` (consolidated view)

## Users and access
- Roles: staff, manager, admin.
- Scoping: always by `hotel_id`; staff sees their department by default.
- Tagging rules: users see threads/tickets they are assigned to or tagged on.

## Core objects
- Ticket (structured request): department, room, guest, payload (form fields), status, assignee, SLA timers.
- Thread (chat): department, participants, messages, attachments, internal notes, translation metadata.
- Event (agenda/invite): audience targeting + accept/decline tracking.

## Department consoles

### Reception (front desk)
- Arrivals/departures view (PMS synced).
- Check-in validation: ID capture review, signature, payment hold status.
- Check-out processing: folio review, payment, invoice delivery.
- Digital key actions: issue/regenerate/deactivate.
- Notes: internal notes shared across departments.

### Concierge hub
- Active conversations ordered by priority/urgency.
- Quick actions: create reservations/transfers (API or manual) and post confirmations into the thread.
- Tips: view tips attributed to staff.

### Housekeeping board
- Room status grid (ready / in progress / needs cleaning).
- Task queue from guest requests (items, cleaning time window).
- Assignment and progress updates; optional photo attachments; maintenance escalation.

### Restaurant + room service
- Orders board with statuses (received → preparing → delivering → delivered).
- Menu management (per hotel) with allergens, modifiers, availability windows.
- Charge posting to folio + tip capture.

### Spa + gym
- Booking board with capacity constraints (practitioner/room).
- Catalog management (treatments/courses) and pricing.
- Confirmation + reminders; feedback capture.

## Cross-department messaging features
- Auto-translation for guest ↔ staff exchanges (configurable per hotel).
- Predefined replies/macros.
- Internal notes channel (staff-only).
- Status tracking (pending / in progress / resolved) visible in the console.
- Search and filters: room number, guest, department, status, assignee, date range.

## Management analytics
- SLA metrics: response time, time-to-resolution, backlog by department.
- Request frequency (to tune standard forms and staffing).
- Revenue attribution: upsells + tips + ancillary services.
- Per-employee activity (volume, speed) with role-based visibility.

