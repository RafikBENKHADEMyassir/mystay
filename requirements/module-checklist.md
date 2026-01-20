# Module checklist (from client docs)

Sources:
- `doc/client_docs/App MySTAY (1).pdf` (user stories)
- `doc/client_docs/Experience client Mystay (1).txt` (end-to-end journeys + department dashboards)
- `doc/client_docs/Arborescence technique MyStay v1 (1).pdf` (screen map)
- `doc/client_docs/design/*` (UI references)

## Guest app (frontend)

### Authentication + reservation link
- Sign up: profile (name, email, phone), ID upload, payment method, credentials.
- Log in: credentials; link to reservation via confirmation number.
- Browse without reservation: view partner hotels + generic services.
- Acceptance criteria: email confirmation; reservation validation against PMS-connected data.

### Home (recap)
- Stay summary: hotel, dates, room (if assigned), adults/children.
- Quick actions: digital key, Wi‑Fi, room controls, itinerary.
- Upsell cards: room upgrade, services, events.

### Navigation
- Bottom navigation: Home, Messages, Agenda, Profile.
- Drawer: Concierge, Reception, Housekeeping, Restaurants, Room Service, Spa & Gym, etc.
- Hotel-configurable module order + enabled/disabled modules.

### Reception: digital check-in / check-out
- Check-in: ID scan (OCR), personal info verification, card hold, e-signature, special requests.
- Validation: update stay status in PMS; activate digital key post-approval.
- Check-out: folio recap, pay (saved card/Apple Pay/Google Pay), email PDF invoice, key deactivation.
- Acceptance criteria: secure + <2 minutes; invoices accessible in Profile post-stay.

### Messaging (global inbox)
- Unified chat across departments (concierge, reception, housekeeping, room service, spa, restaurant).
- Attachments: photos.
- Status/confirmation messages for actions (e.g., transfer booked, order in prep).

### Concierge
- Concierge profile + availability.
- Quick actions: restaurant booking, airport transfer, activities, tickets, recommendations.
- Tips: per interaction; offline mode switches to AI assistant (FAQ + capture requests).

### Housekeeping
- Global toggle (cleaning on/off) with change anytime.
- Chat with housekeeping.
- Quick request icons (configurable by hotel) with quantity + status tracking.

### Room service
- Menu with photos, modifiers, allergens, availability windows.
- Cart + payment; real-time order status; chat with department.
- Feedback + tips after delivery.

### Restaurants
- Menus with photos/prices/allergens.
- Table booking + special requests via chat.
- Confirmation added to Agenda.

### Spa & gym
- Spa catalog + booking (noted as “Spa Booker” integration in brief).
- Gym: equipment/hours, class slots, private coach booking.
- Confirmation, reminders, feedback + tips.

### Agenda
- Unified calendar for all bookings + stay milestones (check-in/out).
- Event invitations (“suggestions”) from hotel managers; accept/decline.
- Notifications and reminders.

### Profile
- Personal info + language preferences.
- Payment methods.
- Stay history + invoices (PDF access/download).
- Loyalty + tips (points, Silver/Gold/Platinum).
- Help & support (FAQ, useful numbers, chatbot).

## Staff + management (admin dashboard)

### Staff auth + roles
- Secure login; roles: staff, manager; department scoping (concierge, reception, housekeeping, spa, F&B).
- Visibility rules: see own department + items you’re tagged on.

### Structured requests (module builder)
- Department-configurable standard forms (multilingual) for common requests.
- Form submissions create structured “tickets” (no free-text required).

### Messaging for custom requests
- If request not covered by standard forms: open a chat thread.
- Features: predefined replies, auto-translation, attachments, internal notes, staff-only channel.
- Assignment: “take ownership”, tag @person or @department (tags hidden from guest).
- Statuses: pending / in progress / resolved.

### Department dashboards
- Reception: arrivals/departures, check-in/out validation, key issuance, payments, notes.
- Concierge: active chats, urgency filters, action tools (transfer/restaurant/etc), tips.
- Housekeeping: room grid status + task assignment and progress.
- F&B + spa: orders/booking boards with SLA visibility.

### Analytics
- Response SLAs by department, request volume, most common requests.
- Revenue attribution (room service, spa, late checkout, upsells).
- Satisfaction + sentiment trends; per-employee activity metrics.

## Backend capabilities implied by the brief

- PMS connectivity: reservation lookup/validation, room status, folio posting, stay lifecycle updates.
- Payments: card holds, charges, refunds, tips; no PAN storage; PSP tokens only.
- Digital keys: key provisioning + wallet delivery; auto deactivate on checkout.
- Notifications: email/SMS (invitation), push/in-app updates for bookings and order statuses.
- Compliance: audit trails for ID capture, signatures, payments, key activations; PII minimization + encryption.

