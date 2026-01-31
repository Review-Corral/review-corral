ALTER TABLE "organizations" DROP CONSTRAINT "organizations_stripe_customer_id_unique";--> statement-breakpoint
DROP INDEX "idx_organizations_customer";--> statement-breakpoint
ALTER TABLE "organizations" DROP COLUMN "stripe_customer_id";--> statement-breakpoint
ALTER TABLE "organizations" DROP COLUMN "stripe_subscription_status";