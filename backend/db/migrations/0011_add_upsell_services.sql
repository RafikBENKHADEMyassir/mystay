-- Upsell services (hotel configuration)

CREATE TABLE IF NOT EXISTS "upsell_services" (
  "id" text PRIMARY KEY NOT NULL,
  "hotel_id" text NOT NULL REFERENCES "hotels"("id") ON DELETE CASCADE,
  "category" text NOT NULL,
  "name" text NOT NULL,
  "touchpoint" text NOT NULL,
  "price_cents" integer NOT NULL,
  "currency" text NOT NULL DEFAULT 'EUR',
  "availability_weekdays" text[] NOT NULL DEFAULT ARRAY[]::text[],
  "enabled" boolean NOT NULL DEFAULT true,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_by_staff_user_id" text REFERENCES "staff_users"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_upsell_services_hotel_id" ON "upsell_services" USING btree ("hotel_id");
CREATE INDEX IF NOT EXISTS "idx_upsell_services_category" ON "upsell_services" USING btree ("hotel_id", "category");
CREATE INDEX IF NOT EXISTS "idx_upsell_services_enabled" ON "upsell_services" USING btree ("hotel_id", "enabled");
CREATE INDEX IF NOT EXISTS "idx_upsell_services_updated_at" ON "upsell_services" USING btree ("hotel_id", "updated_at");

