-- =============================================================================
-- Service Catalog for Standardized Request Modules
-- =============================================================================
-- This migration adds tables for:
-- 1. Service categories per department
-- 2. Service items with form fields
-- 3. Predefined responses for staff
-- 4. Enhanced ticket/message structure for tagging

-- =============================================================================
-- SERVICE CATEGORIES (Department Service Modules)
-- =============================================================================
CREATE TABLE IF NOT EXISTS service_categories (
  id text PRIMARY KEY,
  hotel_id text NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  department text NOT NULL,
  name_key text NOT NULL,  -- Translation key for multilingual support
  name_default text NOT NULL,  -- Default name (fallback)
  description_key text,
  description_default text,
  icon text,  -- Icon identifier (e.g., 'towel', 'food', 'spa')
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT TRUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_categories_hotel_dept 
  ON service_categories(hotel_id, department);
CREATE INDEX IF NOT EXISTS idx_service_categories_active 
  ON service_categories(hotel_id, is_active);

-- =============================================================================
-- SERVICE ITEMS (Individual Services within Categories)
-- =============================================================================
CREATE TABLE IF NOT EXISTS service_items (
  id text PRIMARY KEY,
  category_id text NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
  hotel_id text NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  department text NOT NULL,
  name_key text NOT NULL,
  name_default text NOT NULL,
  description_key text,
  description_default text,
  icon text,
  -- Form configuration stored as JSON
  -- Example: [{"type":"quantity","label":"Number of towels","min":1,"max":10,"default":2},
  --           {"type":"time","label":"Preferred time"},
  --           {"type":"select","label":"Size","options":["small","medium","large"]}]
  form_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Estimated completion time in minutes
  estimated_time_minutes integer,
  -- Price in cents (optional, for display purposes)
  price_cents integer,
  currency text DEFAULT 'EUR',
  -- Auto-assign to specific staff role or leave null for department pool
  auto_assign_role text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT TRUE,
  requires_confirmation boolean NOT NULL DEFAULT FALSE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_items_category 
  ON service_items(category_id);
CREATE INDEX IF NOT EXISTS idx_service_items_hotel_dept 
  ON service_items(hotel_id, department);
CREATE INDEX IF NOT EXISTS idx_service_items_active 
  ON service_items(hotel_id, is_active);

-- =============================================================================
-- PREDEFINED RESPONSES (Quick Replies for Staff)
-- =============================================================================
CREATE TABLE IF NOT EXISTS predefined_responses (
  id text PRIMARY KEY,
  hotel_id text NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  department text NOT NULL,
  -- Optionally link to specific service item
  service_item_id text REFERENCES service_items(id) ON DELETE SET NULL,
  name text NOT NULL,  -- Internal name for staff to identify
  content_key text NOT NULL,  -- Translation key
  content_default text NOT NULL,  -- Default content
  -- Variables that can be replaced (e.g., {time}, {room}, {name})
  variables text[] NOT NULL DEFAULT ARRAY[]::text[],
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT TRUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_predefined_responses_hotel_dept 
  ON predefined_responses(hotel_id, department);
CREATE INDEX IF NOT EXISTS idx_predefined_responses_service 
  ON predefined_responses(service_item_id);

-- =============================================================================
-- MESSAGE MENTIONS (For @tagging system)
-- =============================================================================
CREATE TABLE IF NOT EXISTS message_mentions (
  id text PRIMARY KEY,
  message_id text NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  mention_type text NOT NULL,  -- 'staff' or 'department'
  -- For staff mentions
  staff_user_id text REFERENCES staff_users(id) ON DELETE SET NULL,
  -- For department mentions
  department text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_message_mentions_message 
  ON message_mentions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_mentions_staff 
  ON message_mentions(staff_user_id);
CREATE INDEX IF NOT EXISTS idx_message_mentions_department 
  ON message_mentions(department);

-- =============================================================================
-- TICKET MENTIONS (For assigning tickets via @tagging)
-- =============================================================================
CREATE TABLE IF NOT EXISTS ticket_mentions (
  id text PRIMARY KEY,
  ticket_id text NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  mention_type text NOT NULL,  -- 'staff' or 'department'
  staff_user_id text REFERENCES staff_users(id) ON DELETE SET NULL,
  department text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ticket_mentions_ticket 
  ON ticket_mentions(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_mentions_staff 
  ON ticket_mentions(staff_user_id);

-- =============================================================================
-- ADD service_item_id TO TICKETS (Link ticket to service item)
-- =============================================================================
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS service_item_id text REFERENCES service_items(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tickets_service_item 
  ON tickets(service_item_id);

-- =============================================================================
-- ADD priority AND source TO TICKETS
-- =============================================================================
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';
-- source: 'service_form' (from standard module), 'message' (from chat), 'manual' (staff created)

-- =============================================================================
-- TRANSLATIONS TABLE (For multilingual content)
-- =============================================================================
CREATE TABLE IF NOT EXISTS translations (
  id text PRIMARY KEY,
  hotel_id text NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  key text NOT NULL,
  locale text NOT NULL,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, key, locale)
);

CREATE INDEX IF NOT EXISTS idx_translations_hotel_key 
  ON translations(hotel_id, key);
CREATE INDEX IF NOT EXISTS idx_translations_locale 
  ON translations(hotel_id, locale);

-- =============================================================================
-- STAFF ACTIVITY LOG (For analytics)
-- =============================================================================
CREATE TABLE IF NOT EXISTS staff_activity_log (
  id text PRIMARY KEY,
  hotel_id text NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  staff_user_id text NOT NULL REFERENCES staff_users(id) ON DELETE CASCADE,
  department text NOT NULL,
  action_type text NOT NULL,  -- 'ticket_created', 'ticket_assigned', 'ticket_resolved', 'message_sent'
  target_type text,  -- 'ticket', 'thread', 'message'
  target_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_activity_log_hotel 
  ON staff_activity_log(hotel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_staff_activity_log_staff 
  ON staff_activity_log(staff_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_staff_activity_log_department 
  ON staff_activity_log(hotel_id, department, created_at DESC);
