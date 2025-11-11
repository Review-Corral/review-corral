ALTER TABLE "slack_integrations" ADD COLUMN "scopes" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "slack_integrations" ADD COLUMN "scopes_updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "slack_integrations" ADD COLUMN "scope_history" jsonb DEFAULT '[]'::jsonb;