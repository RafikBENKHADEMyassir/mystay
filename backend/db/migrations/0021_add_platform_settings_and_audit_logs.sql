CREATE TABLE IF NOT EXISTS "platform_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_type" text NOT NULL,
	"actor_id" text,
	"actor_email" text,
	"action" text NOT NULL,
	"resource_type" text,
	"resource_id" text,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip_address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX "idx_audit_logs_action" ON "audit_logs" USING btree ("action");
--> statement-breakpoint
CREATE INDEX "idx_audit_logs_actor_email" ON "audit_logs" USING btree ("actor_email");
--> statement-breakpoint
INSERT INTO platform_settings (key, value) VALUES
  ('rate_limits', '{"apiRequestsPerMinute": 60, "apiRequestsPerHour": 1000, "loginAttemptsPerMinute": 5, "fileUploadMaxMb": 10, "webhooksPerHour": 500}'::jsonb),
  ('backup', '{"enabled": false, "frequency": "daily", "retentionDays": 30, "storageProvider": "none", "lastBackupAt": null}'::jsonb),
  ('compliance', '{"dataRetentionDays": 365, "gdprEnabled": true, "auditLogRetentionDays": 90}'::jsonb),
  ('default_notifications', '{"emailProvider":"none","emailConfig":{},"smsProvider":"none","smsConfig":{},"pushProvider":"none","pushConfig":{}}'::jsonb)
ON CONFLICT (key) DO NOTHING;
