CREATE TABLE "pr_comment_participants" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pr_comment_participants_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"pr_id" bigint NOT NULL,
	"github_username" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pr_comment_participants_pr_user_unique" UNIQUE("pr_id","github_username")
);
--> statement-breakpoint
ALTER TABLE "pr_comment_participants" ADD CONSTRAINT "pr_comment_participants_pr_id_pull_requests_id_fk" FOREIGN KEY ("pr_id") REFERENCES "public"."pull_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_pr_comment_participants_pr" ON "pr_comment_participants" USING btree ("pr_id");