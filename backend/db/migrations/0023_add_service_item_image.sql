-- Add image column to service_items for food/product photos
ALTER TABLE service_items ADD COLUMN IF NOT EXISTS image text;

-- Add gallery_images column to service_categories for category photo galleries
ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS gallery_images jsonb DEFAULT '[]'::jsonb;
