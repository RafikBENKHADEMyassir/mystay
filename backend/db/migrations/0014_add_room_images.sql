-- Room images for hotel room photo carousels
CREATE TABLE room_images (
  id TEXT PRIMARY KEY,
  hotel_id TEXT NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'room',
  title TEXT,
  description TEXT,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by_staff_user_id TEXT REFERENCES staff_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_room_images_hotel_id ON room_images(hotel_id);
CREATE INDEX idx_room_images_category ON room_images(hotel_id, category);
CREATE INDEX idx_room_images_is_active ON room_images(hotel_id, is_active);
CREATE INDEX idx_room_images_sort_order ON room_images(hotel_id, sort_order);
