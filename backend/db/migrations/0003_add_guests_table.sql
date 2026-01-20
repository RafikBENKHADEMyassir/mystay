-- Add guests table for hotel client authentication
CREATE TABLE IF NOT EXISTS guests (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  id_document_url text,
  id_document_verified boolean NOT NULL DEFAULT false,
  payment_method_id text,
  payment_provider text,
  email_verified boolean NOT NULL DEFAULT false,
  email_verification_token text,
  email_verification_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guests_email ON guests(email);

-- Link stays to guests (optional - a stay may or may not have a guest account linked)
ALTER TABLE stays ADD COLUMN IF NOT EXISTS guest_id text REFERENCES guests(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_stays_guest_id ON stays(guest_id);
