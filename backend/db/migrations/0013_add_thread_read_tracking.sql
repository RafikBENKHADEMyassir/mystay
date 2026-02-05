-- Thread read tracking for guest messaging

ALTER TABLE threads
ADD COLUMN IF NOT EXISTS guest_last_read_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_threads_guest_last_read_at ON threads(hotel_id, stay_id, guest_last_read_at);
