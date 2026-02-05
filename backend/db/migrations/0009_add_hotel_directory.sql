-- Hotel directory content builder (draft + published per hotel)

CREATE TABLE IF NOT EXISTS "hotel_directory_pages" (
  "hotel_id" text PRIMARY KEY NOT NULL REFERENCES "hotels"("id") ON DELETE CASCADE,
  "draft" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "published" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "draft_saved_at" timestamp with time zone NOT NULL DEFAULT now(),
  "published_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_hotel_directory_pages_updated_at" ON "hotel_directory_pages" USING btree ("hotel_id", "updated_at");

