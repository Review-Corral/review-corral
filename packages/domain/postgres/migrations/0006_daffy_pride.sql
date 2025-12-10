CREATE TABLE "review_thread_participants" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "review_thread_participants_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"thread_id" bigint NOT NULL,
	"github_username" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "review_thread_participants_thread_user_unique" UNIQUE("thread_id","github_username")
);
--> statement-breakpoint
CREATE INDEX "idx_review_thread_participants_thread" ON "review_thread_participants" USING btree ("thread_id");