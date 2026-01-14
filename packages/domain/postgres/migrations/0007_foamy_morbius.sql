ALTER TABLE "pull_requests" ADD COLUMN "additions" integer;--> statement-breakpoint
ALTER TABLE "pull_requests" ADD COLUMN "deletions" integer;--> statement-breakpoint
ALTER TABLE "pull_requests" ADD COLUMN "author_login" text;--> statement-breakpoint
ALTER TABLE "pull_requests" ADD COLUMN "author_avatar_url" text;--> statement-breakpoint
ALTER TABLE "pull_requests" ADD COLUMN "target_branch" text;