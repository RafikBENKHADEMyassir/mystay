-- Add bookable service fields to upsell_services
ALTER TABLE upsell_services
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS time_slots TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS bookable BOOLEAN NOT NULL DEFAULT FALSE;

-- Service bookings table for bookable upsell services (cleaning, spa, etc.)
CREATE TABLE IF NOT EXISTS service_bookings (
  id TEXT PRIMARY KEY,
  hotel_id TEXT NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  stay_id TEXT REFERENCES stays(id) ON DELETE SET NULL,
  upsell_service_id TEXT NOT NULL REFERENCES upsell_services(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  booking_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'confirmed',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_bookings_hotel ON service_bookings(hotel_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_stay ON service_bookings(stay_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_service ON service_bookings(upsell_service_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_date ON service_bookings(hotel_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_service_bookings_status ON service_bookings(hotel_id, status);
