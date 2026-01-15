CREATE TABLE "review_request_dms" (
	"slack_channel_id" text NOT NULL,
	"slack_message_ts" text NOT NULL,
	"pull_request_id" bigint NOT NULL,
	"reviewer_github_username" text NOT NULL,
	"org_id" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "review_request_dms" ADD CONSTRAINT "review_request_dms_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_review_request_dms_pr_reviewer" ON "review_request_dms" USING btree ("pull_request_id","reviewer_github_username");--> statement-breakpoint
CREATE INDEX "idx_review_request_dms_org" ON "review_request_dms" USING btree ("org_id");