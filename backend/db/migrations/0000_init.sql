CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"hotel_id" text NOT NULL,
	"stay_id" text,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hotel_integrations" (
	"hotel_id" text PRIMARY KEY NOT NULL,
	"pms_provider" text DEFAULT 'mock' NOT NULL,
	"pms_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"digital_key_provider" text DEFAULT 'none' NOT NULL,
	"digital_key_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hotel_notifications" (
	"hotel_id" text PRIMARY KEY NOT NULL,
	"email_provider" text DEFAULT 'none' NOT NULL,
	"email_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sms_provider" text DEFAULT 'none' NOT NULL,
	"sms_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"push_provider" text DEFAULT 'none' NOT NULL,
	"push_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hotels" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"hotel_id" text NOT NULL,
	"stay_id" text,
	"title" text NOT NULL,
	"department" text,
	"amount_cents" integer NOT NULL,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"points_earned" integer DEFAULT 0 NOT NULL,
	"issued_at" date NOT NULL,
	"download_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" text PRIMARY KEY NOT NULL,
	"thread_id" text NOT NULL,
	"sender_type" text NOT NULL,
	"sender_name" text,
	"body_text" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_outbox" (
	"id" text PRIMARY KEY NOT NULL,
	"hotel_id" text NOT NULL,
	"channel" text NOT NULL,
	"provider" text NOT NULL,
	"to_address" text NOT NULL,
	"subject" text,
	"body_text" text,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_users" (
	"id" text PRIMARY KEY NOT NULL,
	"hotel_id" text NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"role" text NOT NULL,
	"departments" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stays" (
	"id" text PRIMARY KEY NOT NULL,
	"hotel_id" text NOT NULL,
	"confirmation_number" text NOT NULL,
	"room_number" text,
	"check_in" date NOT NULL,
	"check_out" date NOT NULL,
	"adults" integer DEFAULT 1 NOT NULL,
	"children" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "threads" (
	"id" text PRIMARY KEY NOT NULL,
	"hotel_id" text NOT NULL,
	"stay_id" text,
	"department" text NOT NULL,
	"status" text NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" text PRIMARY KEY NOT NULL,
	"hotel_id" text NOT NULL,
	"stay_id" text,
	"room_number" text,
	"department" text NOT NULL,
	"status" text NOT NULL,
	"title" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_stay_id_stays_id_fk" FOREIGN KEY ("stay_id") REFERENCES "public"."stays"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotel_integrations" ADD CONSTRAINT "hotel_integrations_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotel_notifications" ADD CONSTRAINT "hotel_notifications_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_stay_id_stays_id_fk" FOREIGN KEY ("stay_id") REFERENCES "public"."stays"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_outbox" ADD CONSTRAINT "notification_outbox_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_users" ADD CONSTRAINT "staff_users_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stays" ADD CONSTRAINT "stays_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_stay_id_stays_id_fk" FOREIGN KEY ("stay_id") REFERENCES "public"."stays"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_stay_id_stays_id_fk" FOREIGN KEY ("stay_id") REFERENCES "public"."stays"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_events_hotel_id" ON "events" USING btree ("hotel_id");--> statement-breakpoint
CREATE INDEX "idx_events_stay_id" ON "events" USING btree ("stay_id");--> statement-breakpoint
CREATE INDEX "idx_events_start_at" ON "events" USING btree ("start_at");--> statement-breakpoint
CREATE INDEX "idx_invoices_hotel_id" ON "invoices" USING btree ("hotel_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_stay_id" ON "invoices" USING btree ("stay_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_issued_at" ON "invoices" USING btree ("issued_at");--> statement-breakpoint
CREATE INDEX "idx_messages_thread_id" ON "messages" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "idx_messages_created_at" ON "messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_notification_outbox_hotel_id" ON "notification_outbox" USING btree ("hotel_id");--> statement-breakpoint
CREATE INDEX "idx_notification_outbox_status_next_attempt" ON "notification_outbox" USING btree ("status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "idx_staff_users_hotel_id" ON "staff_users" USING btree ("hotel_id");--> statement-breakpoint
CREATE INDEX "idx_staff_users_email" ON "staff_users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "staff_users_email_unique" ON "staff_users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "stays_confirmation_number_unique" ON "stays" USING btree ("confirmation_number");--> statement-breakpoint
CREATE INDEX "idx_stays_confirmation_number" ON "stays" USING btree ("confirmation_number");--> statement-breakpoint
CREATE INDEX "idx_stays_hotel_id" ON "stays" USING btree ("hotel_id");--> statement-breakpoint
CREATE INDEX "idx_threads_hotel_id" ON "threads" USING btree ("hotel_id");--> statement-breakpoint
CREATE INDEX "idx_threads_stay_id" ON "threads" USING btree ("stay_id");--> statement-breakpoint
CREATE INDEX "idx_threads_department" ON "threads" USING btree ("department");--> statement-breakpoint
CREATE INDEX "idx_threads_status" ON "threads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_tickets_hotel_id" ON "tickets" USING btree ("hotel_id");--> statement-breakpoint
CREATE INDEX "idx_tickets_stay_id" ON "tickets" USING btree ("stay_id");--> statement-breakpoint
CREATE INDEX "idx_tickets_department" ON "tickets" USING btree ("department");--> statement-breakpoint
CREATE INDEX "idx_tickets_status" ON "tickets" USING btree ("status");