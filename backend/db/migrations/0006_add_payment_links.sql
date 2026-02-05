-- =============================================================================
-- Pay by Link - Payment Links
-- =============================================================================

CREATE TABLE IF NOT EXISTS payment_links (
  id text PRIMARY KEY,
  hotel_id text NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  stay_id text REFERENCES stays(id) ON DELETE SET NULL,
  guest_id text REFERENCES guests(id) ON DELETE SET NULL,
  payer_type text NOT NULL DEFAULT 'guest', -- 'guest' | 'visitor'
  payer_name text,
  payer_email text,
  payer_phone text,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  reason_category text,
  reason_text text,
  pms_status text NOT NULL DEFAULT 'not_configured',
  payment_status text NOT NULL DEFAULT 'created',
  payment_provider text,
  provider_reference text,
  public_token text NOT NULL UNIQUE,
  public_url text NOT NULL,
  created_by_staff_user_id text REFERENCES staff_users(id) ON DELETE SET NULL,
  paid_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_links_hotel_id ON payment_links(hotel_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_stay_id ON payment_links(stay_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_guest_id ON payment_links(guest_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_payment_status ON payment_links(hotel_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_links_created_at ON payment_links(hotel_id, created_at DESC);

