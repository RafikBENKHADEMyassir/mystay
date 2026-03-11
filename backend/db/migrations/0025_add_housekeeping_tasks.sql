CREATE TABLE IF NOT EXISTS housekeeping_tasks (
  id TEXT PRIMARY KEY,
  hotel_id TEXT NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  floor INTEGER NOT NULL DEFAULT 1,
  room_type TEXT NOT NULL DEFAULT 'Standard',
  status TEXT NOT NULL DEFAULT 'dirty',
  assigned_staff_user_id TEXT REFERENCES staff_users(id) ON DELETE SET NULL,
  stay_id TEXT REFERENCES stays(id) ON DELETE SET NULL,
  guest_name TEXT,
  check_out TEXT,
  priority TEXT NOT NULL DEFAULT 'normal',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_housekeeping_tasks_hotel ON housekeeping_tasks(hotel_id);
CREATE INDEX IF NOT EXISTS idx_housekeeping_tasks_status ON housekeeping_tasks(hotel_id, status);
CREATE INDEX IF NOT EXISTS idx_housekeeping_tasks_assigned ON housekeeping_tasks(assigned_staff_user_id);
CREATE UNIQUE INDEX IF NOT EXISTS housekeeping_tasks_hotel_room_unique ON housekeeping_tasks(hotel_id, room_number);
