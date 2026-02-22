-- Useful informations: categorized hotel information displayed to guests
-- Categories: Wi-Fi, Breakfast, Gym, Pool, Parking, etc.
-- Items: key-value pairs within each category

CREATE TABLE IF NOT EXISTS useful_info_categories (
  id TEXT PRIMARY KEY,
  hotel_id TEXT NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS useful_info_items (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES useful_info_categories(id) ON DELETE CASCADE,
  hotel_id TEXT NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_useful_info_categories_hotel ON useful_info_categories(hotel_id);
CREATE INDEX IF NOT EXISTS idx_useful_info_categories_active ON useful_info_categories(hotel_id, is_active);
CREATE INDEX IF NOT EXISTS idx_useful_info_items_category ON useful_info_items(category_id);
CREATE INDEX IF NOT EXISTS idx_useful_info_items_hotel ON useful_info_items(hotel_id);
CREATE INDEX IF NOT EXISTS idx_useful_info_items_active ON useful_info_items(hotel_id, is_active);
