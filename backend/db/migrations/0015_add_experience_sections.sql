-- Experience sections (Plaisirs sur mesure, Expériences culinaires, Moments à vivre)
-- These are configurable carousel sections on the guest home page

CREATE TABLE experience_sections (
  id TEXT PRIMARY KEY,
  hotel_id TEXT NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  slug TEXT NOT NULL, -- 'tailored', 'culinary', 'activities'
  title_fr TEXT NOT NULL,
  title_en TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, slug)
);

CREATE TABLE experience_items (
  id TEXT PRIMARY KEY,
  section_id TEXT NOT NULL REFERENCES experience_sections(id) ON DELETE CASCADE,
  hotel_id TEXT NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_experience_sections_hotel ON experience_sections(hotel_id);
CREATE INDEX idx_experience_items_section ON experience_items(section_id);
CREATE INDEX idx_experience_items_hotel ON experience_items(hotel_id);

-- Add room_type_id and room_number to room_images for room-specific photos
ALTER TABLE room_images ADD COLUMN room_type TEXT;
ALTER TABLE room_images ADD COLUMN room_number TEXT;

CREATE INDEX idx_room_images_room ON room_images(hotel_id, room_number);
