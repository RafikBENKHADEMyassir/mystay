-- Automations + message templates (hotel communication)

CREATE TABLE IF NOT EXISTS "automations" (
  "id" text PRIMARY KEY NOT NULL,
  "hotel_id" text NOT NULL REFERENCES "hotels"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "description" text,
  "trigger" text NOT NULL,
  "status" text NOT NULL DEFAULT 'active',
  "config" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_by_staff_user_id" text REFERENCES "staff_users"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_automations_hotel_id" ON "automations" USING btree ("hotel_id");
CREATE INDEX IF NOT EXISTS "idx_automations_status" ON "automations" USING btree ("hotel_id", "status");
CREATE INDEX IF NOT EXISTS "idx_automations_updated_at" ON "automations" USING btree ("hotel_id", "updated_at");

CREATE TABLE IF NOT EXISTS "message_templates" (
  "id" text PRIMARY KEY NOT NULL,
  "hotel_id" text NOT NULL REFERENCES "hotels"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "description" text,
  "channel" text NOT NULL,
  "status" text NOT NULL DEFAULT 'draft',
  "content" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_by_staff_user_id" text REFERENCES "staff_users"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_message_templates_hotel_id" ON "message_templates" USING btree ("hotel_id");
CREATE INDEX IF NOT EXISTS "idx_message_templates_channel" ON "message_templates" USING btree ("hotel_id", "channel");
CREATE INDEX IF NOT EXISTS "idx_message_templates_status" ON "message_templates" USING btree ("hotel_id", "status");
CREATE INDEX IF NOT EXISTS "idx_message_templates_updated_at" ON "message_templates" USING btree ("hotel_id", "updated_at");

