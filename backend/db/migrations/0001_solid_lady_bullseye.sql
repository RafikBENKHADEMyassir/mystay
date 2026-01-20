CREATE TABLE "internal_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"hotel_id" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"department" text NOT NULL,
	"author_staff_user_id" text,
	"author_name" text NOT NULL,
	"body_text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "threads" ADD COLUMN "assigned_staff_user_id" text;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "assigned_staff_user_id" text;--> statement-breakpoint
ALTER TABLE "internal_notes" ADD CONSTRAINT "internal_notes_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_notes" ADD CONSTRAINT "internal_notes_author_staff_user_id_staff_users_id_fk" FOREIGN KEY ("author_staff_user_id") REFERENCES "public"."staff_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_internal_notes_target" ON "internal_notes" USING btree ("hotel_id","target_type","target_id");--> statement-breakpoint
CREATE INDEX "idx_internal_notes_department" ON "internal_notes" USING btree ("hotel_id","department");--> statement-breakpoint
CREATE INDEX "idx_internal_notes_created_at" ON "internal_notes" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_assigned_staff_user_id_staff_users_id_fk" FOREIGN KEY ("assigned_staff_user_id") REFERENCES "public"."staff_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assigned_staff_user_id_staff_users_id_fk" FOREIGN KEY ("assigned_staff_user_id") REFERENCES "public"."staff_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_threads_assigned_staff_user_id" ON "threads" USING btree ("assigned_staff_user_id");--> statement-breakpoint
CREATE INDEX "idx_tickets_assigned_staff_user_id" ON "tickets" USING btree ("assigned_staff_user_id");