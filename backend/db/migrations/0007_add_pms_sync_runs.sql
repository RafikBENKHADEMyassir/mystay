-- PMS sync job runs (platform admin monitoring)

CREATE TABLE IF NOT EXISTS "pms_sync_runs" (
  "id" text PRIMARY KEY NOT NULL,
  "hotel_id" text NOT NULL REFERENCES "hotels"("id") ON DELETE CASCADE,
  "status" text NOT NULL,
  "started_at" timestamp with time zone NOT NULL DEFAULT now(),
  "finished_at" timestamp with time zone,
  "summary" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "error_message" text,
  "error_details" text
);

CREATE INDEX IF NOT EXISTS "idx_pms_sync_runs_hotel_id" ON "pms_sync_runs" USING btree ("hotel_id");
CREATE INDEX IF NOT EXISTS "idx_pms_sync_runs_status" ON "pms_sync_runs" USING btree ("status");
CREATE INDEX IF NOT EXISTS "idx_pms_sync_runs_started_at" ON "pms_sync_runs" USING btree ("started_at");

