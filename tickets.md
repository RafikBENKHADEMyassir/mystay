# Tickets (working tracker)

Last updated: 2026-01-27

Spec source:
- `requirements/mvp-jira-backlog-staff-platform.md`
- `design/home/*`

Status tags:
- `status:todo` | `status:in-progress` | `status:blocked` | `status:done`

## P0 (MVP)

### Guest web app (design/home)
- [x] CL-AUTH-001 First screen + login + help (`status:done`)
- [x] CL-AUTH-002 Sign-up flow + link reservation (`status:done`)
- [x] CL-HOME-001 Home overview (recap + room photos) (`status:done`)
- [x] CL-CHECKIN-001 Digital check-in (validated inputs + payment) (`status:done`)
- [x] CL-CHECKOUT-001 Check-out + tip + invoice (`status:done`)
- [x] BE-GUEST-001 Guest overview + check-in/out APIs (`status:done`)
- [x] BUG-CL-MSG-001 Guest messages unread badge + realtime refresh (`status:done`)

### Reservations management
- [x] ST-RES-001 Reservations list view (Arrivals / Checked-in / Checked-out / Cancelled) (`status:done`)
- [x] ST-RES-002 Reservation detail drawer (`status:done`)
- [x] ST-RES-003 PMS-backed reservations (sync + add/edit) (`status:done`)

### Inbox and messaging (staff)
- [x] ST-INBOX-001 Unified inbox (Requests + Messages) (`status:done`)
- [x] ST-INBOX-002 Resolve and archive flow (`status:done`)
- [x] BUG-ST-INBOX-003 Clear composer after send (`status:done`)

### Pay by link (payments)
- [x] ST-PAY-001 Payment links list (`status:done`)
- [x] ST-PAY-002 Create payment link (`status:done`)

## P1 (next)

### SaaS admin dashboard (platform level)
- [x] AD-PLAT-001 Property setup navigation (`status:done`)
- [x] AD-SYNC-001 PMS data synchronization monitor (`status:done`)

### Audience and CRM
- [x] ST-AUD-001 Audience overview (`status:done`)
- [x] ST-AUD-002 Sign-up forms management (`status:done`)

## P2 (later)

### Hotel directory / content builder
- [x] ST-CONT-001 Hotel directory page editor (`status:done`)

### Automations and message templates
- [x] ST-AUTO-001 Automation rules list (`status:done`)
- [x] ST-MSG-001 Message templates management (`status:done`)

### Upselling and services
- [x] ST-UP-001 Upsell services configuration (`status:done`)
