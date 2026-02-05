# MVP Jira backlog (staff and platform dashboards)

Sources:
- `doc/client_docs/flow1.pdf` (AeroGuest-inspired UI references; pages 2-10)

Assumptions (tracked elsewhere):
- Staff authentication and role model already exist (staff vs manager vs admin).
- All staff endpoints are scoped by `hotel_id` (staff see their hotel; managers/admin can expand scope).

Priorities:
- P0: MVP (pilot-ready)
- P1: Next (post-pilot expansion)
- P2: Later (advanced configuration)

## Backlog (priority order)

### 1) ST-RES-001 — Reservations list view (Arrivals / In-house / Checked-out)

- Priority: P0
- Type: Story
- Description: Build reservations table allowing staff to manage arrivals, in-house guests, and check-outs.
- UI reference: AeroGuest Reservations screen (`doc/client_docs/flow1.pdf`, page 2)
- Acceptance criteria:
  - Tabs: Arrivals / Checked-in / Checked-out / Cancelled
  - Table columns:
    - Guest name
    - Phone
    - Email
    - Arrival date
    - Departure date
    - Room number
    - Journey status (e.g., missing contact info)
  - Date range filter
  - Search by guest name or reservation number
  - Pagination or infinite scroll
- API:
  - `GET /staff/reservations?status=&from=&to=&search=`
- Permissions:
  - Staff see only their hotel
  - Managers see all reservations
- Edge cases:
  - Missing contact info highlighted
  - Reservation without linked user still visible

### 2) ST-RES-002 — Reservation detail drawer

- Priority: P0
- Type: Story
- Description: Clicking a reservation opens a side panel with full guest and stay details.
- UI reference: AeroGuest Reservations screen (`doc/client_docs/flow1.pdf`, page 2)
- Acceptance criteria:
  - Shows:
    - Guest profile
    - Stay details
    - Check-in / check-out status
    - Linked requests and messages
  - Actions:
    - Open conversation
    - Trigger check-in reminder
    - Create payment link
  - Read-only unless manager
- API:
  - `GET /staff/reservations/{id}`

### 3) ST-INBOX-001 — Unified inbox (Requests + Messages)

- Priority: P0
- Type: Story
- Description: Staff inbox aggregating all client communications, similar to AeroGuest Inbox.
- UI reference: Inbox screen (`doc/client_docs/flow1.pdf`, page 6)
- Acceptance criteria:
  - Left panel:
    - Conversation list
    - Filters: Messages / Archived / Ratings
    - Each conversation shows: guest name, room number, last message, timestamp
  - Right panel:
    - Full chat thread
    - Client messages + staff replies
    - "Archive conversation" action
- API:
  - `GET /staff/conversations`
  - `PATCH /staff/conversations/{id}/archive`

### 4) ST-INBOX-002 — Resolve and archive flow

- Priority: P0
- Type: Story
- Description: Allow staff to mark a conversation as resolved and archive it.
- UI reference: Inbox screen (`doc/client_docs/flow1.pdf`, page 6)
- Acceptance criteria:
  - Button "Case resolved? Archive now"
  - Archived conversations move to Archive tab
  - Archived conversations are read-only
  - Client still sees conversation history

### 5) ST-PAY-001 — Payment links list

- Priority: P0
- Type: Story
- Description: Staff can view all payment links created for guests.
- UI reference: Pay by Link screen (`doc/client_docs/flow1.pdf`, page 3)
- Acceptance criteria:
  - Table columns:
    - Created date
    - Guest name
    - Type (Guest / Visitor)
    - Amount
    - Reason (Deposit, F&B, SPA...)
    - PMS status
    - Payment status (Created / Paid / Failed / Expired)
  - Filter by date, status, guest
  - Status badges are color-coded
- API:
  - `GET /staff/payment-links`

### 6) ST-PAY-002 — Create payment link

- Priority: P0
- Type: Story
- Description: Staff can create a new payment link for extras or deposits.
- UI reference: Pay by Link screen (`doc/client_docs/flow1.pdf`, page 3)
- Acceptance criteria:
  - Form fields:
    - Guest (search/select)
    - Amount
    - Reason (dropdown + free text)
  - Generates secure payment URL
  - Link can be copied or sent via message/email
  - Status starts as "Created"
- API:
  - `POST /staff/payment-links`

### 7) AD-PLAT-001 — Property setup navigation

- Priority: P1
- Type: Story
- Description: Unified property setup section grouping configuration areas (payments, room service, rules, sync).
- Acceptance criteria:
  - Left navigation:
    - Menu setup
    - Payments
    - Room service
    - Minibar
    - Upselling
    - Check-in/out config
    - Hotel rules
    - Data synchronization
    - Notification center
  - Each section loads dynamically

### 8) AD-SYNC-001 — PMS data synchronization monitor

- Priority: P1
- Type: Story
- Description: Admin can monitor and trigger PMS sync jobs.
- Acceptance criteria:
  - View last sync time
  - Sync status (OK / Error)
  - Manual "Sync now" button
  - Error logs visible to admin only

### 9) ST-AUD-001 — Audience overview

- Priority: P1
- Type: Story
- Description: View guest contact database with opt-in status.
- UI reference: Audience dashboard (`doc/client_docs/flow1.pdf`, page 4)
- Acceptance criteria:
  - KPI cards:
    - Total contacts
    - Opted-in this week
    - Skipped this week
  - Table:
    - Opt-in date
    - Name
    - Email
    - Channel (App / Manual import)
    - Synced with PMS (Yes/No)
  - CSV export
- API:
  - `GET /staff/audience`
  - `GET /staff/audience/export`

### 10) ST-AUD-002 — Sign-up forms management

- Priority: P1
- Type: Story
- Description: Manage guest signup forms used during check-in or stay.
- UI reference: Sign-up forms (`doc/client_docs/flow1.pdf`, page 5)
- Acceptance criteria:
  - List forms with: name, channel (Check-in, Stay, etc.), created by, last edited
  - Actions: Edit / Duplicate / Delete
  - Create new signup form
- API:
  - `GET /staff/signup-forms`
  - `POST /staff/signup-forms`
  - `PATCH /staff/signup-forms/{id}`

### 11) ST-CONT-001 — Hotel directory page editor

- Priority: P2
- Type: Story
- Description: Drag-and-drop editor to manage hotel directory page shown to guests.
- UI reference: Hotel Directory editor (`doc/client_docs/flow1.pdf`, page 7)
- Acceptance criteria:
  - Components: sections, headings, text blocks, buttons, images/galleries, videos
  - Drag-drop layout
  - Live preview
  - Multi-language toggle
  - Save draft / publish
- API:
  - `GET /staff/hotel-directory`
  - `PATCH /staff/hotel-directory`

### 12) ST-AUTO-001 — Automation rules list

- Priority: P2
- Type: Story
- Description: View and manage automated flows (check-in invitation, booking confirmation, etc.).
- UI reference: Automations list (`doc/client_docs/flow1.pdf`, page 8)
- Acceptance criteria:
  - List automations with: name, trigger, status (Active/Paused), last updated
  - Create new automation
  - Enable / disable automation
- API:
  - `GET /staff/automations`
  - `PATCH /staff/automations/{id}/toggle`

### 13) ST-MSG-001 — Message templates management

- Priority: P2
- Type: Story
- Description: Manage reusable message templates used in automations and manual messages.
- UI reference: Message templates (`doc/client_docs/flow1.pdf`, page 9)
- Acceptance criteria:
  - Template list: name, channel, status, languages supported
  - Actions: Edit / Duplicate / Archive
  - Preview per language
- API:
  - `GET /staff/message-templates`
  - `POST /staff/message-templates`

### 14) ST-UP-001 — Upsell services configuration

- Priority: P2
- Type: Story
- Description: Configure upsell services offered to guests before/during stay.
- UI reference: Upselling services screen (`doc/client_docs/flow1.pdf`, page 10)
- Acceptance criteria:
  - Categories (Parking, Sports and recreation, etc.)
  - Each service: name, touchpoint (Before stay / During stay), price, availability by weekday, enabled toggle
  - Add / edit / disable service
- API:
  - `GET /staff/upsell-services`
  - `POST /staff/upsell-services`
  - `PATCH /staff/upsell-services/{id}`

