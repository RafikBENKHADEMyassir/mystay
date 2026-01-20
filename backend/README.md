# Backend (API)

Minimal Node server to start iterating on API contracts before choosing a full framework.

## Run
- Dev (Node 18+): `npm run dev:backend`
- Health check: `curl http://localhost:4000/health`
- Notifications worker (dev): `npm run dev:worker:notifications`
- Mock integrations (from repo root): `npm run dev:mock:opera` and `npm run dev:mock:spabooker` (or `./dev.sh`)

## Database (Postgres)
- Configure `DATABASE_URL` in `backend/.env` (see `backend/.env.example`).
- Reset + seed (dev only): `npm run db:reset` (drops + recreates the `public` schema).
- Generate migrations: `npm run db:generate -- --name <label>`.
- Migrations are generated from `backend/src/db/drizzle/schema.ts` and stored in `backend/db/migrations/`.
- Seed data lives in `backend/db/seed.sql`.

## Integrations

The backend includes connectors for external services:

### PMS Integration
- **Supported providers**: Opera Cloud, Mews, Cloudbeds, Mock (for testing)
- **Features**: Reservation lookup, folio retrieval, guest profile updates
- **Configuration**: Set `PMS_PROVIDER` and provider-specific credentials in `.env`

### Payment Integration (Stripe)
- **Features**: Authorization holds, charges, refunds, tips processing
- **Configuration**: Set `STRIPE_SECRET_KEY` in `.env`

### Digital Key Integration
- **Supported providers**: Alliants, OpenKey, None (disabled)
- **Features**: Issue mobile keys, revoke keys, extend validity
- **Configuration**: Set `DIGITAL_KEY_PROVIDER` and provider credentials in `.env`

### Spa Integration
- **Supported providers**: SpaBooker (mock server included), Mindbody (connector stub), None (disabled)
- **Features**: Service catalog, availability, bookings
- **Configuration**: Configure `spa_provider`/`spa_config` via the admin integrations page.

### OCR Service
- **Supported providers**: AWS Textract, Google Vision, Azure Vision, Mock
- **Features**: ID document scanning and data extraction
- **Configuration**: Set `OCR_PROVIDER` and API credentials in `.env`

### AI Concierge
- **Provider**: OpenAI GPT-4
- **Features**: Guest query handling, recommendations, sentiment analysis
- **Configuration**: Set `OPENAI_API_KEY` and hotel information in `.env`

All integrations are managed through the `IntegrationManager` singleton in `src/integrations/integration-manager.mjs`.

## Notes
- Backend uses Postgres with JSON configs and Postgres NOTIFY for realtime updates.
- Auth:
  - Guest token: issued by `GET /api/v1/stays/lookup?confirmation=...`
  - Staff token: issued by `POST /api/v1/auth/staff/login`
- Integration connectors support multiple providers with consistent interfaces.
