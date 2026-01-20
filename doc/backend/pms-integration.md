# PMS Integration Guide (Opera, Mews, Cloudbeds, others)

## Goals
- Sync reservations, room status, folios, and charges to enable digital check-in/out, housekeeping routing, and agenda updates.
- Deliver real-time messaging triggers (arrivals, status changes) and enforce compliance (ID capture, signatures, payments).

## Common Integration Patterns
- **API connectivity**: Prefer vendor REST/GraphQL where available (Mews, Cloudbeds). For Opera, use OWS/OCIS/HTNG interfaces or a certified middleware partner.
- **Webhooks/Events**: Subscribe to reservation lifecycle, room status, and folio updates. If webhooks are unavailable, poll delta endpoints with cursors and backoff.
- **Identifiers**: Normalize on `reservationId`, `roomNumber`, `guestId`, and `hotelId`. Store PMS references alongside internal IDs for traceability.
- **Auth**: Use OAuth2/client credentials where offered; otherwise HTTPS with signed credentials. Never store PMS creds in code—keep them in `.env` and rotate regularly.

## Data Flows to Support Requirements
- **Check-in/out**: Pull reservation + rate + balance; push ID verification, signatures, and card holds; update status to checked-in/checked-out; deactivate digital keys post-checkout.
- **Housekeeping**: Ingest room status (vacant/occupied/dirty/clean) and dispatch tasks; push status updates back to PMS if supported.
- **Agenda**: Mirror bookings (spa, dining if managed in PMS) and enrich with internal modules; maintain a unified calendar keyed by guest and stay.
- **Charges & Tips**: Post room charges and gratuities to folios with tax codes; handle reversals/voids; reconcile against PMS balances.
- **Notifications**: Trigger alerts on reservation creation/changes, early check-in availability, and overdue tasks.

## Vendor Notes
- **Opera (OWS/HTNG)**:
  - Use certified middleware or vendor-approved connectors to avoid direct PMS room server exposure.
  - Work with OWS interfaces: `ResvAdvanced` (reservations), `FolioPost` (charges), `Name` (profiles), `Housekeeping` (room status).
  - Map Opera confirmation/room numbers to internal IDs; Opera often requires queue-based polling—plan for retries and idempotency keys.
- **Mews**:
  - Use Mews API + Webhooks; leverage `Reservations/Updated`, `Customers/Updated`, `Services` for housekeeping.
  - Authentication via client token; respect rate limits; use `UtcDateTime` for pagination.
- **Cloudbeds**:
  - REST API with OAuth2; pull `reservations`, `rooms`, `folios`; push charges via folio endpoints.
  - Beware of polling limits; cache tokens; validate room/folio mapping before posting charges.

## Security & Compliance
- Secrets in `.env` only; provide `.env.example` placeholders. Use HTTPS/TLS for all PMS calls.
- Log request IDs, not PII; redact names/payment data in logs. Encrypt at rest for any PII stored.
- Maintain audit logs for ID capture, signatures, payments, and key activations; expose to ops and compliance.

## Reliability & Monitoring
- Idempotent writes with client-generated request IDs; retry on network errors with jittered backoff.
- Health checks per PMS connector; alert on webhook failures or drift between PMS state and local cache.
- Periodic reconciliation job to re-sync reservations/folios and detect mismatches.

## Implementation Steps (recommended)
1) Configure environment per hotel: PMS type, base URL, credentials, property IDs, feature flags.  
2) Build a connector service layer (e.g., `backend/src/pms/{opera,mews,cloudbeds}.ts`) with typed DTOs and mappers.  
3) Implement event ingestion (webhooks) + polling fallback; store cursors/checkpoints.  
4) Wire check-in/out flows to PMS updates and key management; block key activation until PMS confirms.  
5) Post room-service/spa/restaurant charges with validation and rollback paths; log audit events.  
6) Add monitoring (metrics + structured logs) and ops runbooks for retry/rehydration.  
7) End-to-end test in vendor sandbox/cert environments before production cutover per property.
