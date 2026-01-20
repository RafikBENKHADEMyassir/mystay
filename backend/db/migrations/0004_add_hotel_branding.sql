-- Add branding fields to hotels table
ALTER TABLE hotels
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS cover_image_url text,
ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#1a1a2e',
ADD COLUMN IF NOT EXISTS secondary_color text DEFAULT '#f5a623',
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'Europe/Paris',
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'EUR',
ADD COLUMN IF NOT EXISTS star_rating integer,
ADD COLUMN IF NOT EXISTS amenities text[] DEFAULT ARRAY[]::text[],
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Create index for active hotels
CREATE INDEX IF NOT EXISTS idx_hotels_is_active ON hotels(is_active);

-- Create platform_admins table for super admin users
CREATE TABLE IF NOT EXISTS platform_admins (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_admins_email ON platform_admins(email);

-- Add role field to staff_users if not exists (check constraint for valid roles)
-- Roles: admin (hotel admin), manager, staff
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'staff_users_role_check'
  ) THEN
    ALTER TABLE staff_users ADD CONSTRAINT staff_users_role_check 
    CHECK (role IN ('admin', 'manager', 'staff'));
  END IF;
END$$;
