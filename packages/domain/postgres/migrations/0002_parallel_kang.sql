ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ALTER COLUMN "avatar_url" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ALTER COLUMN "installation_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ALTER COLUMN "type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "slack_integrations" ALTER COLUMN "slack_team_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "slack_integrations" ALTER COLUMN "access_token" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "slack_integrations" ALTER COLUMN "channel_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "slack_integrations" ALTER COLUMN "channel_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "slack_users" ALTER COLUMN "real_name_normalized" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "price_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "status";