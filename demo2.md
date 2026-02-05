# MyStay demo script (client walkthrough)

This is a step-by-step demo script you can follow on localhost. It is organized by persona: guest, hotel manager, housekeeping staff, and SaaS (platform) admin.

## Demo prep

### Start the stack

1) Install dependencies (first time only): `npm install`
2) Start everything + reset DB (recommended before a client demo): `./dev.sh --reset-db`
3) Open the apps:
   - Guest app: `http://localhost:3000`
   - Admin dashboard: `http://localhost:3001`
   - Backend API (health): `http://localhost:4000/health`

### Prepare upselling images (for the screenshot carousels)

The Four Seasons upselling seed uses image paths under `frontend/public/images/experiences/`.

Add your JPGs with these exact filenames:

- Plaisirs sur mesure:
  - `fleurs.jpg`
  - `champagne.jpg`
  - `lettre.jpg`
  - `magazine.jpg`
  - `vos-upsells.jpg`
- Expériences culinaires:
  - `sea-fu.jpg`
  - `coya.jpg`
  - `mimi-kakushi.jpg`
  - `scalini.jpg`
  - `verde.jpg`
  - `pastries.jpg`
  - `nusr-et.jpg`
  - `nammos.jpg`
- Moments à vivre:
  - `safari.jpg`
  - `burj-al-arab-tour.jpg`
  - `padel.jpg`
  - `jet-ski.jpg`
  - `surf.jpg`
  - `helicopter-tour.jpg`
  - `sunrise-balloon.jpg`

Alternative: you can upload images from the admin dashboard in the "Upselling" page. Uploaded files are served from the backend under `/uploads/`.

### Use a mobile viewport

In Chrome: open DevTools -> Toggle device toolbar -> pick an iPhone size. The guest home page is designed mobile-first.

## Demo accounts

### Guest (Four Seasons Paris)

- Email: `sophie.martin@email.com`
- Password: `admin123`

### Hotel staff (Four Seasons Paris)

- Manager: `manager@fourseasons.demo` / `admin123`
- Housekeeping: `housekeeping@fourseasons.demo` / `admin123`
- Reception: `reception@fourseasons.demo` / `admin123`
- Concierge: `concierge@fourseasons.demo` / `admin123`
- Spa: `spa@fourseasons.demo` / `admin123`
- Room service: `roomservice@fourseasons.demo` / `admin123`

### SaaS (platform) admin

- Email: `admin@mystay.com`
- Password: `admin123`

## Recommended demo order

1) Guest app (mobile home + upselling)
2) Hotel manager (configure upselling + branding)
3) Housekeeper (process requests)
4) SaaS admin (platform view across hotels)

## Guest demo (mobile web app)

1) Open the guest app: `http://localhost:3000`
2) Tap "Connexion" / "Sign in"
3) Login with:
   - `sophie.martin@email.com` / `admin123`
4) Home page highlights (mobile):
   - Hotel hero image + logo (branding comes from hotel settings)
   - Room card (room number + dates)
   - Quick actions chips
   - Agenda preview (seeded demo events)
   - Upselling carousels by category:
     - "Plaisirs sur mesure"
     - "Expériences culinaires"
     - "Moments à vivre"
   - Swipe each carousel horizontally (only 2 cards are visible at once; the rest overflow).
5) Optional: show existing conversations and requests:
   - Bottom nav -> "Messages" to show seeded conversations
   - Bottom nav -> "Services" to browse the service directory

## Hotel manager demo (admin dashboard)

### Login

1) Open `http://localhost:3001/login`
2) Keep "Hotel Staff" selected
3) Login with: `manager@fourseasons.demo` / `admin123`

### Hotel branding (background, logo, colors)

1) In the left menu, open `Settings`
2) In "Branding":
   - Upload a logo and cover image (optional)
   - Save changes
3) Refresh the guest home page to show:
   - Updated hero background (cover image)
   - Updated logo

### Upselling configuration (categories + cards)

1) In the left menu, open `Upselling` (`/home-carousels`)
2) Show the seeded categories for Four Seasons:
   - "Plaisirs sur mesure"
   - "Expériences culinaires"
   - "Moments à vivre"
3) Show that each category has multiple cards (label, image, optional link).
4) Demo edits:
   - Reorder: change "Sort order" on a section or a card, then save
   - Hide/show: toggle "Active", then save
   - Add a new card:
     - Choose a section
     - Set label (ex: "FLEURS")
     - Upload an image
     - Optionally set "Link URL" (ex: `/services` or `/restaurants`)
5) Refresh the guest home page and show that:
   - Categories render in order
   - Cards render in each carousel with the updated image/label

## Housekeeper demo (admin dashboard)

### Login

1) Open `http://localhost:3001/login`
2) Keep "Hotel Staff" selected
3) Login with: `housekeeping@fourseasons.demo` / `admin123`

### Process a request (tickets)

1) In the left menu, open `Requests` (`/requests`)
2) Filter by department: `housekeeping`
3) Open a ticket (for example "2 extra towels requested")
4) Demo handling steps:
   - Take ownership
   - Add an internal note
   - Change status: `pending` -> `in_progress` -> `resolved`

### Reply to the guest (messages)

1) Open `Inbox` (`/inbox`)
2) Filter by department: `housekeeping`
3) Open a conversation (seeded demo thread)
4) Send a reply message

## SaaS admin demo (platform admin)

1) Open `http://localhost:3001/login`
2) Switch to "Platform Admin"
3) Login with: `admin@mystay.com` / `admin123`
4) Platform dashboard:
   - Open "Manage Hotels" (`/platform/hotels`)
   - Open "Four Seasons Hotel George V"
   - Show hotel overview (branding preview + staff list)
5) Optional: show multi-hotel overview by opening another property (Geneva, Bulgari, Mamounia).

## Troubleshooting (demo day)

- If upselling cards are gray/empty: the image files are missing under `frontend/public/images/experiences/` or need to be uploaded from `/home-carousels`.
- If the guest app shows the welcome screen instead of the stay home: login as `sophie.martin@email.com` / `admin123` (this sets the session cookie).
- If you see "Backend unreachable": restart with `./dev.sh --reset-db` and verify `http://localhost:4000/health`.
