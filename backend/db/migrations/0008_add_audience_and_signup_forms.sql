-- Audience contacts + signup form definitions (staff CRM)

CREATE TABLE IF NOT EXISTS "audience_contacts" (
  "id" text PRIMARY KEY NOT NULL,
  "hotel_id" text NOT NULL REFERENCES "hotels"("id") ON DELETE CASCADE,
  "guest_id" text REFERENCES "guests"("id") ON DELETE SET NULL,
  "status" text NOT NULL,
  "status_at" timestamp with time zone,
  "name" text NOT NULL,
  "email" text,
  "phone" text,
  "channel" text NOT NULL,
  "synced_with_pms" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_audience_contacts_hotel_id" ON "audience_contacts" USING btree ("hotel_id");
CREATE INDEX IF NOT EXISTS "idx_audience_contacts_status" ON "audience_contacts" USING btree ("hotel_id", "status");
CREATE INDEX IF NOT EXISTS "idx_audience_contacts_status_at" ON "audience_contacts" USING btree ("hotel_id", "status_at");
CREATE UNIQUE INDEX IF NOT EXISTS "audience_contacts_hotel_email_unique" ON "audience_contacts" USING btree ("hotel_id", "email");

CREATE TABLE IF NOT EXISTS "signup_forms" (
  "id" text PRIMARY KEY NOT NULL,
  "hotel_id" text NOT NULL REFERENCES "hotels"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "description" text,
  "channel" text NOT NULL,
  "status" text NOT NULL DEFAULT 'active',
  "config" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_by_staff_user_id" text REFERENCES "staff_users"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_signup_forms_hotel_id" ON "signup_forms" USING btree ("hotel_id");
CREATE INDEX IF NOT EXISTS "idx_signup_forms_channel" ON "signup_forms" USING btree ("hotel_id", "channel");
CREATE INDEX IF NOT EXISTS "idx_signup_forms_status" ON "signup_forms" USING btree ("hotel_id", "status");
CREATE INDEX IF NOT EXISTS "idx_signup_forms_updated_at" ON "signup_forms" USING btree ("hotel_id", "updated_at");

