# Frontend architecture

> Next.js App Router, file-based routing under `src/app/`.
> All guest-facing routes are locale-prefixed: `/[locale]/...`

---

## Current directory structure

```
frontend/src/
├── app/                          # Routes (Next.js App Router)
│   ├── layout.tsx                # Root: <html>, <body>, globals.css
│   ├── globals.css
│   ├── admin/page.tsx            # Redirects to external admin app
│   ├── pay/[token]/page.tsx      # Public payment link (no locale)
│   └── [locale]/                 # Locale wrapper (en, fr, es)
│       ├── layout.tsx            # LocaleProvider
│       ├── page.tsx              # Home / overview
│       ├── (auth)/               # Auth route group (no nav chrome)
│       ├── (experience)/         # Main guest app (desktop nav + bottom nav)
│       └── (check-in)/           # Check-in / check-out flows
├── components/                   # Shared UI and feature components
├── lib/                          # Utilities, hooks, i18n, auth helpers
├── types/                        # Shared TypeScript types
├── middleware.ts                 # Auth guards, locale redirects
└── tests/                        # Unit tests
```

---

## Route groups and pages

### `(auth)` — Authentication flows

No navigation chrome. Redirect to home when already authenticated.

| Route | Page | Purpose |
|-------|------|---------|
| `/login` | `login/page.tsx` | Email + password sign-in |
| `/signup` | `signup/page.tsx` | Multi-step registration (welcome, profile, password, link, created) |
| `/forgot-password` | `forgot-password/page.tsx` | Password recovery / support links |
| `/link-reservation` | `link-reservation/page.tsx` | Link a stay via confirmation number |

Private components: `signup/_components/` (step forms), `signup/_lib/` (validation, types).

### `(experience)` — Main guest app

Desktop sidebar + mobile bottom nav. Protected routes require authentication.

| Route | Page | Domain | Purpose |
|-------|------|--------|---------|
| `/services` | `services/page.tsx` | **Services** | Service catalog, active requests |
| `/agenda` | `agenda/page.tsx` | **Services** | Unified stay calendar |
| `/concierge` | `concierge/page.tsx` | **Services** | Concierge chat + quick actions |
| `/housekeeping` | `housekeeping/page.tsx` | **Services** | Cleaning toggle, supply requests |
| `/room-service` | `room-service/page.tsx` | **F&B** | Menu, ordering, delivery tracking |
| `/restaurants` | `restaurants/page.tsx` | **F&B** | Restaurant list, table bookings |
| `/spa-gym` | `spa-gym/page.tsx` | **Wellness** | Spa + gym catalog, slot booking |
| `/spa` | `spa/page.tsx` | **Wellness** | Redirect to `/spa-gym?tab=spa` |
| `/gym` | `gym/page.tsx` | **Wellness** | Redirect to `/spa-gym?tab=gym` |
| `/room` | `room/page.tsx` | **Room** | Room details, images, quick actions |
| `/reception` | `reception/page.tsx` | **Room** | Reception / digital key |
| `/messages` | `messages/page.tsx` | **Communication** | Thread list |
| `/messages/[threadId]` | `messages/[threadId]/page.tsx` | **Communication** | Single conversation |
| `/profile` | `profile/page.tsx` | **Account** | Identity, payments, preferences, logout |
| `/hotels` | `hotels/page.tsx` | **Public** | Hotel selection with search |
| `/operations` | `operations/page.tsx` | **Staff** | Department consoles, workflows |
| `/analytics` | `analytics/page.tsx` | **Staff** | KPIs, SLAs, satisfaction trends |
| `/experience` | `experience/page.tsx` | *(redirect)* | Redirects to `/services` |

### `(check-in)` — Check-in / check-out

Simple full-height layout, no sidebar/bottom nav.

| Route | Page | Purpose |
|-------|------|---------|
| `/reception/check-in` | `reception/check-in/page.tsx` | Multi-step check-in (personal, ID, payment) |
| `/reception/check-out` | `reception/check-out/page.tsx` | Folio review, tips, confirmation |

### Standalone (no locale)

| Route | Page | Purpose |
|-------|------|---------|
| `/pay/[token]` | `pay/[token]/page.tsx` | Public payment link |
| `/admin` | `admin/page.tsx` | Redirect to admin app |

---

## Component library

```
components/
├── ui/                  # Design system primitives (button, card, dialog, input, ...)
├── auth/                # Auth form helpers (labeled-field, rule-item)
├── chat/                # Message bubble, composer
├── layout/              # App shell, guest shell, page header, topbar
├── navigation/          # Bottom nav, desktop nav, header, sidebar, side-drawer
├── overview/            # Home page sections (hero, guest info, quick actions, agenda, carousel)
├── providers/           # Context providers (locale)
├── restaurant/          # Restaurant booking form, bottom sheet
├── sections/            # Reusable page sections (feature grid, order tracking, summary cards, tip dialog)
└── services/            # Service catalog, cards, request dialog/form, notification card
```

---

## Shared utilities

```
lib/
├── auth.ts              # Cookie-based session helpers
├── demo-session.ts      # Demo/seed session management
├── guest-content.ts     # Fetch hotel content from API
├── navigation.ts        # Nav items, icons, bottom nav config
├── phone-countries.ts   # Phone country codes
├── utils.ts             # cn() and misc helpers
├── hooks/               # React hooks
│   ├── use-agenda-events.ts
│   ├── use-experience-sections.ts
│   ├── use-guest-content.ts
│   ├── use-guest-overview.ts
│   ├── use-realtime-messages.ts
│   └── use-room-thumbnail.ts
├── i18n/                # Internationalization
│   ├── locales.ts       # Locale definitions (en, fr, es)
│   ├── paths.ts         # withLocale(), stripLocale(), getLocale()
│   ├── translate.ts     # t() translation function
│   └── messages/        # Translation files (en.ts, fr.ts, es.ts)
└── utils/
    └── date.ts          # Date formatting helpers
```

---

## Middleware (`src/middleware.ts`)

- **Locale enforcement**: Redirects bare paths to `/[locale]/...`, detects from cookie or `Accept-Language`.
- **Auth guards**: Protected paths (`/services`, `/messages`, `/profile`, `/agenda`, `/experience`) redirect to `/login` if unauthenticated.
- **Auth-only paths**: `/login`, `/signup` redirect to home when already authenticated.
- **Excluded**: `/_next`, `/api`, `/admin`, static files.

---

## Navigation architecture

| Component | Viewport | Location | Items shown |
|-----------|----------|----------|-------------|
| `DesktopNav` | `lg+` | Fixed left sidebar | All guest + operations items |
| `BottomNav` | `< lg` | Fixed bottom bar | Home, Services, Messages, Profile |
| `SideDrawer` | `< lg` | Slide-out from hamburger | Full service list + logout |
| `Topbar` | `< lg` | Sticky top | Back button, page title |

---

## Layout hierarchy

```
RootLayout (html, body, globals.css)
└── [locale]/layout.tsx (LocaleProvider)
    ├── page.tsx ← Home / overview (no nav group)
    ├── (auth)/layout.tsx ← No navigation chrome
    │   ├── login/
    │   ├── signup/
    │   ├── forgot-password/
    │   └── link-reservation/
    ├── (experience)/layout.tsx ← DesktopNav + BottomNav
    │   ├── services/
    │   ├── agenda/
    │   ├── concierge/
    │   ├── housekeeping/
    │   ├── room-service/
    │   ├── restaurants/
    │   ├── spa-gym/
    │   ├── room/
    │   ├── messages/
    │   ├── profile/
    │   ├── operations/
    │   ├── analytics/
    │   └── hotels/
    └── (check-in)/layout.tsx ← Minimal full-screen
        └── reception/
            ├── check-in/
            └── check-out/
```

---

## Proposed grouping (for future refactor)

The `(experience)` route group currently holds 17 pages in a flat list. For better discoverability and maintainability, these could be organized into domain-based subgroups.

> **Note**: Next.js route groups `(groupName)` do not affect the URL. They only organize code and can share layouts.

```
[locale]/
├── page.tsx                              # Home / overview
│
├── (auth)/                               # Auth — no nav chrome
│   ├── layout.tsx
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── forgot-password/page.tsx
│   └── link-reservation/page.tsx
│
├── (main)/                               # Main app — desktop nav + bottom nav
│   ├── layout.tsx                        # DesktopNav + BottomNav
│   │
│   ├── services/page.tsx                 # Service hub / catalog
│   ├── agenda/page.tsx                   # Stay calendar
│   │
│   ├── (hotel-services)/                 # Hotel services subgroup
│   │   ├── concierge/page.tsx
│   │   ├── housekeeping/page.tsx
│   │   ├── room/page.tsx
│   │   └── reception/page.tsx
│   │
│   ├── (food-and-beverage)/              # F&B subgroup
│   │   ├── room-service/page.tsx
│   │   └── restaurants/page.tsx
│   │
│   ├── (wellness)/                       # Wellness subgroup
│   │   ├── spa-gym/page.tsx
│   │   ├── spa/page.tsx                  # (redirect)
│   │   └── gym/page.tsx                  # (redirect)
│   │
│   ├── (communication)/                  # Messaging subgroup
│   │   ├── messages/page.tsx
│   │   └── messages/[threadId]/page.tsx
│   │
│   └── profile/page.tsx                  # Account / profile
│
├── (check-in)/                           # Check-in / check-out — minimal layout
│   ├── layout.tsx
│   └── reception/
│       ├── check-in/page.tsx
│       └── check-out/page.tsx
│
├── (staff)/                              # Staff-only — separate from guest app
│   ├── layout.tsx                        # Could have staff-specific nav
│   ├── operations/page.tsx
│   └── analytics/page.tsx
│
└── hotels/page.tsx                       # Public hotel selection (no auth needed)
```

### What changes

| Current | Proposed | Why |
|---------|----------|-----|
| `(experience)/` flat list | `(main)/` with domain subgroups | 17 siblings → max 5-6 per group |
| Staff pages mixed with guest | `(staff)/` separate route group | Different audience, could have own layout/nav |
| `hotels/` inside `(experience)` | Top-level under `[locale]` | Public page, no auth needed |
| Home page outside any group | Stays at top level | It is the default landing page |

### Component grouping to match

```
components/
├── ui/                     # Primitives (unchanged)
├── auth/                   # Auth forms
├── layout/                 # Shells, headers, topbar
├── navigation/             # Nav components
├── providers/              # Context providers
├── home/                   # Home/overview sections (currently "overview/")
├── services/               # Service catalog + requests
├── hotel-services/         # Concierge, housekeeping, room, reception
├── food-and-beverage/      # Room service, restaurants
├── wellness/               # Spa, gym
├── communication/          # Messages, chat
├── profile/                # Profile-specific components
├── check-in/               # Check-in / check-out step forms
└── staff/                  # Operations, analytics
```

---

## API routes

```
app/api/
├── auth/
│   ├── login/route.ts           # POST login
│   ├── logout/route.ts          # POST logout
│   ├── session/route.ts         # GET current session
│   ├── signup/route.ts          # POST register
│   └── link-reservation/route.ts # POST link stay
└── hotels/
    ├── public/route.ts          # GET public hotel list
    └── [hotelId]/
        ├── experiences/route.ts  # GET hotel experiences
        └── guest-content/route.ts # GET hotel guest content
```

---

## Key files quick reference

| What | Where |
|------|-------|
| Global styles | `src/app/globals.css` |
| Middleware (auth + locale) | `src/middleware.ts` |
| Nav config (items, icons) | `src/lib/navigation.ts` |
| Auth helpers | `src/lib/auth.ts` |
| Translation function | `src/lib/i18n/translate.ts` |
| Locale definitions | `src/lib/i18n/locales.ts` |
| Translation strings | `src/lib/i18n/messages/{en,fr,es}.ts` |
| Guest content fetcher | `src/lib/guest-content.ts` |
| Package config | `frontend/package.json` |
| TypeScript config | `frontend/tsconfig.json` |
| Test config | `frontend/vitest.config.ts` |
