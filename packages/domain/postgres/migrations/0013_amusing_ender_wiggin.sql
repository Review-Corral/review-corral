CREATE TABLE "slack_comment_dm_mappings" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "slack_comment_dm_mappings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"slack_channel_id" text NOT NULL,
	"slack_message_ts" text NOT NULL,
	"org_id" bigint NOT NULL,
	"slack_team_id" text NOT NULL,
	"target_type" text NOT NULL,
	"owner" text NOT NULL,
	"repo" text NOT NULL,
	"github_comment_id" bigint NOT NULL,
	"comment_author_github_username" text NOT NULL,
	"comment_body" text,
	"pr_title" text NOT NULL,
	"pr_number" bigint NOT NULL,
	"comment_url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "slack_comment_dm_message_unique" UNIQUE("slack_channel_id","slack_message_ts")
);
--> statement-breakpoint
CREATE TABLE "slack_processed_events" (
	"slack_event_id" text PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "slack_reaction_mirrors" (
	"id" text PRIMARY KEY NOT NULL,
	"slack_channel_id" text NOT NULL,
	"slack_message_ts" text NOT NULL,
	"reactor_slack_user_id" text NOT NULL,
	"emoji" text NOT NULL,
	"target_type" text NOT NULL,
	"owner" text NOT NULL,
	"repo" text NOT NULL,
	"github_comment_id" text NOT NULL,
	"github_reaction_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "slack_reaction_mirror_unique" UNIQUE("slack_channel_id","slack_message_ts","reactor_slack_user_id","emoji")
);
--> statement-breakpoint
ALTER TABLE "slack_comment_dm_mappings" ADD CONSTRAINT "slack_comment_dm_mappings_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_slack_comment_dm_mappings_org" ON "slack_comment_dm_mappings" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_slack_comment_dm_mappings_team" ON "slack_comment_dm_mappings" USING btree ("slack_team_id");--> statement-breakpoint
CREATE INDEX "idx_slack_reaction_mirrors_target" ON "slack_reaction_mirrors" USING btree ("owner","repo","github_comment_id");