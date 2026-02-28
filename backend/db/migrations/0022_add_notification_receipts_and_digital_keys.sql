ALTER TABLE "notification_outbox" ADD COLUMN IF NOT EXISTS "sent_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "notification_outbox" ADD COLUMN IF NOT EXISTS "external_id" text;
--> statement-breakpoint
ALTER TABLE "notification_outbox" ADD COLUMN IF NOT EXISTS "receipt_status" text;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "digital_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"hotel_id" text NOT NULL,
	"stay_id" text,
	"guest_id" text,
	"room_number" text,
	"external_key_id" text,
	"provider" text NOT NULL,
	"status" text NOT NULL DEFAULT 'active',
	"valid_from" timestamp with time zone,
	"valid_to" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "digital_keys" ADD CONSTRAINT "digital_keys_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "digital_keys" ADD CONSTRAINT "digital_keys_stay_id_stays_id_fk" FOREIGN KEY ("stay_id") REFERENCES "public"."stays"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_digital_keys_hotel_id" ON "digital_keys" USING btree ("hotel_id");
--> statement-breakpoint
CREATE INDEX "idx_digital_keys_stay_id" ON "digital_keys" USING btree ("stay_id");
--> statement-breakpoint
CREATE INDEX "idx_digital_keys_status" ON "digital_keys" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "idx_notification_outbox_sent_at" ON "notification_outbox" USING btree ("sent_at");
