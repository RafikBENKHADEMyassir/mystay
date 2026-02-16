CREATE TABLE IF NOT EXISTS guest_content_configs (
  hotel_id text PRIMARY KEY REFERENCES hotels(id) ON DELETE CASCADE,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guest_content_configs_hotel_id
  ON guest_content_configs(hotel_id);
