CREATE TABLE "dm_message_links" (
	"slack_channel_id" text NOT NULL,
	"slack_message_ts" text NOT NULL,
	"github_comment_id" bigint NOT NULL,
	"comment_type" text NOT NULL,
	"repo_owner" text NOT NULL,
	"repo_name" text NOT NULL,
	"org_id" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dm_message_links_slack_unique" UNIQUE("slack_channel_id","slack_message_ts")
);
--> statement-breakpoint
CREATE TABLE "review_request_dms" (
	"slack_channel_id" text NOT NULL,
	"slack_message_ts" text NOT NULL,
	"pull_request_id" bigint NOT NULL,
	"reviewer_github_username" text NOT NULL,
	"org_id" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "review_request_dms_pr_reviewer_unique" UNIQUE("pull_request_id","reviewer_github_username")
);
--> statement-breakpoint
ALTER TABLE "dm_message_links" ADD CONSTRAINT "dm_message_links_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_request_dms" ADD CONSTRAINT "review_request_dms_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_dm_message_links_slack" ON "dm_message_links" USING btree ("slack_channel_id","slack_message_ts");--> statement-breakpoint
CREATE INDEX "idx_dm_message_links_org" ON "dm_message_links" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_review_request_dms_pr_reviewer" ON "review_request_dms" USING btree ("pull_request_id","reviewer_github_username");--> statement-breakpoint
CREATE INDEX "idx_review_request_dms_org" ON "review_request_dms" USING btree ("org_id");