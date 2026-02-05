-- Stay snapshot fields (PMS reservation + guest contact)

ALTER TABLE stays
ADD COLUMN IF NOT EXISTS pms_reservation_id text,
ADD COLUMN IF NOT EXISTS pms_status text,
ADD COLUMN IF NOT EXISTS guest_first_name text,
ADD COLUMN IF NOT EXISTS guest_last_name text,
ADD COLUMN IF NOT EXISTS guest_email text,
ADD COLUMN IF NOT EXISTS guest_phone text;

CREATE INDEX IF NOT EXISTS idx_stays_pms_reservation_id ON stays(hotel_id, pms_reservation_id);
CREATE INDEX IF NOT EXISTS idx_stays_guest_email ON stays(hotel_id, guest_email);
