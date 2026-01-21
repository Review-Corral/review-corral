ALTER TABLE "pull_requests" ADD COLUMN "status" text;--> statement-breakpoint
ALTER TABLE "pull_requests" ADD COLUMN "closed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pull_requests" ADD COLUMN "merged_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "idx_pull_requests_status" ON "pull_requests" USING btree ("status","is_draft","created_at");