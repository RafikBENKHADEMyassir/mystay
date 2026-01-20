-- NOTE: This file is a legacy snapshot of the schema.
-- Source of truth is now `backend/src/db/drizzle/schema.ts` + `backend/db/migrations/`.

CREATE TABLE IF NOT EXISTS hotels (
  id text PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hotel_integrations (
  hotel_id text PRIMARY KEY REFERENCES hotels(id) ON DELETE CASCADE,
  pms_provider text NOT NULL DEFAULT 'mock',
  pms_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  digital_key_provider text NOT NULL DEFAULT 'none',
  digital_key_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  spa_provider text NOT NULL DEFAULT 'none',
  spa_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hotel_notifications (
  hotel_id text PRIMARY KEY REFERENCES hotels(id) ON DELETE CASCADE,
  email_provider text NOT NULL DEFAULT 'none',
  email_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  sms_provider text NOT NULL DEFAULT 'none',
  sms_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  push_provider text NOT NULL DEFAULT 'none',
  push_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staff_users (
  id text PRIMARY KEY,
  hotel_id text NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  display_name text,
  role text NOT NULL,
  departments text[] NOT NULL DEFAULT ARRAY[]::text[],
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_users_hotel_id ON staff_users(hotel_id);
CREATE INDEX IF NOT EXISTS idx_staff_users_email ON staff_users(email);

CREATE TABLE IF NOT EXISTS notification_outbox (
  id text PRIMARY KEY,
  hotel_id text NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  channel text NOT NULL,
  provider text NOT NULL,
  to_address text NOT NULL,
  subject text,
  body_text text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_outbox_hotel_id ON notification_outbox(hotel_id);
CREATE INDEX IF NOT EXISTS idx_notification_outbox_status_next_attempt ON notification_outbox(status, next_attempt_at);

CREATE TABLE IF NOT EXISTS stays (
  id text PRIMARY KEY,
  hotel_id text NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  confirmation_number text NOT NULL UNIQUE,
  room_number text,
  check_in date NOT NULL,
  check_out date NOT NULL,
  adults integer NOT NULL DEFAULT 1,
  children integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stays_confirmation_number ON stays(confirmation_number);
CREATE INDEX IF NOT EXISTS idx_stays_hotel_id ON stays(hotel_id);

CREATE TABLE IF NOT EXISTS tickets (
  id text PRIMARY KEY,
  hotel_id text NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  stay_id text REFERENCES stays(id) ON DELETE SET NULL,
  room_number text,
  department text NOT NULL,
  status text NOT NULL,
  title text NOT NULL,
  assigned_staff_user_id text REFERENCES staff_users(id) ON DELETE SET NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tickets_hotel_id ON tickets(hotel_id);
CREATE INDEX IF NOT EXISTS idx_tickets_stay_id ON tickets(stay_id);
CREATE INDEX IF NOT EXISTS idx_tickets_department ON tickets(department);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_staff_user_id ON tickets(assigned_staff_user_id);

CREATE TABLE IF NOT EXISTS threads (
  id text PRIMARY KEY,
  hotel_id text NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  stay_id text REFERENCES stays(id) ON DELETE SET NULL,
  department text NOT NULL,
  status text NOT NULL,
  title text NOT NULL,
  assigned_staff_user_id text REFERENCES staff_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_threads_hotel_id ON threads(hotel_id);
CREATE INDEX IF NOT EXISTS idx_threads_stay_id ON threads(stay_id);
CREATE INDEX IF NOT EXISTS idx_threads_department ON threads(department);
CREATE INDEX IF NOT EXISTS idx_threads_status ON threads(status);
CREATE INDEX IF NOT EXISTS idx_threads_assigned_staff_user_id ON threads(assigned_staff_user_id);

CREATE TABLE IF NOT EXISTS messages (
  id text PRIMARY KEY,
  thread_id text NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  sender_type text NOT NULL,
  sender_name text,
  body_text text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

CREATE TABLE IF NOT EXISTS internal_notes (
  id text PRIMARY KEY,
  hotel_id text NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  target_type text NOT NULL,
  target_id text NOT NULL,
  department text NOT NULL,
  author_staff_user_id text REFERENCES staff_users(id) ON DELETE SET NULL,
  author_name text NOT NULL,
  body_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_internal_notes_target ON internal_notes(hotel_id, target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_internal_notes_department ON internal_notes(hotel_id, department);
CREATE INDEX IF NOT EXISTS idx_internal_notes_created_at ON internal_notes(created_at);

CREATE TABLE IF NOT EXISTS events (
  id text PRIMARY KEY,
  hotel_id text NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  stay_id text REFERENCES stays(id) ON DELETE SET NULL,
  type text NOT NULL,
  title text NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  status text NOT NULL DEFAULT 'scheduled',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_hotel_id ON events(hotel_id);
CREATE INDEX IF NOT EXISTS idx_events_stay_id ON events(stay_id);
CREATE INDEX IF NOT EXISTS idx_events_start_at ON events(start_at);

CREATE TABLE IF NOT EXISTS invoices (
  id text PRIMARY KEY,
  hotel_id text NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  stay_id text REFERENCES stays(id) ON DELETE SET NULL,
  title text NOT NULL,
  department text,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  points_earned integer NOT NULL DEFAULT 0,
  issued_at date NOT NULL,
  download_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_hotel_id ON invoices(hotel_id);
CREATE INDEX IF NOT EXISTS idx_invoices_stay_id ON invoices(stay_id);
CREATE INDEX IF NOT EXISTS idx_invoices_issued_at ON invoices(issued_at);
