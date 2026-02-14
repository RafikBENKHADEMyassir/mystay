-- Add room_numbers array to room_images to allow filtering images by specific rooms
ALTER TABLE room_images ADD COLUMN room_numbers TEXT[];

-- Add index for array containment queries if needed (optional but good practice)
-- CREATE INDEX idx_room_images_room_numbers ON room_images USING GIN (room_numbers);
