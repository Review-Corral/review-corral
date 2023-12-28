DO $$ BEGIN
 CREATE TYPE "organization_type" AS ENUM('User', 'Organization');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "github_integration" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"team_id" text NOT NULL,
	"access_token" text NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "github_integration_team_id_key" UNIQUE("team_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "github_repositories" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"repository_id" bigint NOT NULL,
	"repository_name" text NOT NULL,
	"installation_id" integer NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"organization_id" text NOT NULL,
	CONSTRAINT "github_repositories_repository_id_key" UNIQUE("repository_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"account_name" text NOT NULL,
	"account_id" bigint NOT NULL,
	"installation_id" bigint NOT NULL,
	"avatar_url" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now(),
	"organization_type" "organization_type",
	CONSTRAINT "organizations_account_id_key" UNIQUE("account_id"),
	CONSTRAINT "organizations_installation_id_key" UNIQUE("installation_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pull_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"thread_ts" text,
	"pr_id" text NOT NULL,
	"organization_id" text,
	"draft" boolean DEFAULT false NOT NULL,
	CONSTRAINT "pull_requests_thread_ts_key" UNIQUE("thread_ts"),
	CONSTRAINT "unique_pr_id" UNIQUE("pr_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "slack_integration" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"access_token" text NOT NULL,
	"channel_id" text NOT NULL,
	"channel_name" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"slack_team_name" text NOT NULL,
	"slack_team_id" text NOT NULL,
	"organization_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "username_mappings" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"github_username" text NOT NULL,
	"slack_user_id" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	"organization_id" text,
	CONSTRAINT "username_mappings_slack_username_key" UNIQUE("slack_user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"email" text,
	"updated_at" timestamp with time zone DEFAULT now(),
	"gh_access_token" text,
	"gh_refresh_token" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users_and_organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"org_id" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "github_repositories" ADD CONSTRAINT "github_repositories_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pull_requests" ADD CONSTRAINT "pull_requests_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "slack_integration" ADD CONSTRAINT "slack_integration_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "username_mappings" ADD CONSTRAINT "username_mappings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users_and_organizations" ADD CONSTRAINT "users_and_organizations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users_and_organizations" ADD CONSTRAINT "users_and_organizations_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
