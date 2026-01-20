# Screen map (design → routes)

This maps the current design references in `doc/client_docs/design/` to proposed Next.js routes and the data each screen expects.

## Home / recap
- Design: `doc/client_docs/design/body recap.png`
- Route: `/`
- Needs:
  - Hotel profile (name, branding assets, module ordering).
  - Stay summary (dates, room, adults/children, reservation id).
  - Quick actions state (digital key enabled, Wi‑Fi details, itinerary link, room controls availability).
  - Service highlights (next housekeeping slot, open concierge thread, current upsells/events).

## Services list
- Design: `doc/client_docs/design/body services.png`
- Route: `/services` (or a section on `/`)
- Needs:
  - Enabled modules + ordering per hotel.
  - For each module: current status (e.g., “transfer booked”, “cleaning in progress”).

## Concierge
- Design: `doc/client_docs/design/body concierge.png`
- Route: `/concierge`
- Needs:
  - Assigned concierge profile + availability.
  - Quick actions catalog (restaurant booking, transfers, activities, tickets, recommendations).
  - Active requests + their statuses.

## Chat (concierge example)
- Design: `doc/client_docs/design/body messages concierge.png`, `doc/client_docs/design/message bubble.png`, `doc/client_docs/design/message bar.png`
- Route: `/messages` (thread list) + `/messages/[threadId]` (thread)
- Needs:
  - Threads: department, last message, unread count, status.
  - Messages: text, attachments, timestamps, sender (guest vs staff), delivery state.
  - Structured request cards (generated from “standard forms” submissions).
  - Translation toggle per message (client brief mentions auto-translation).

## Tips (bottom sheet)
- Design: `doc/client_docs/design/bottom-sheet tip.png`
- Component: `TipBottomSheet` reused across concierge/room service/spa/etc.
- Needs:
  - Tip rules per hotel/department (fixed %, fixed amount, custom).
  - Payment intent/session from PSP; link tip to staff member when applicable.

## Check-in (personal info step)
- Design: `doc/client_docs/design/page.png`, `doc/client_docs/design/topbar.png`
- Route: `/reception/check-in` (stepper)
- Needs:
  - Guest profile draft (editable) + validation rules.
  - Language preference.
  - Stay purpose (personal/work) and required fields.

## ID upload / capture
- Design: `doc/client_docs/design/Dépot Pièce d’identité.png`
- Route: `/reception/check-in/id`
- Needs:
  - Secure upload (pre-signed URL or server action proxy).
  - OCR extraction result + manual correction flow.
  - Audit event for ID capture.

## Stay history + invoices
- Design: `doc/client_docs/design/body history.png`
- Route: `/profile/history`
- Needs:
  - Past stays list.
  - Invoices list per stay + signed URLs for PDF downloads.
  - Loyalty points attribution per line item (if enabled).

