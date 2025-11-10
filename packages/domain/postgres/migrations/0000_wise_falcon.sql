CREATE TABLE "branches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repo_id" bigint NOT NULL,
	"name" text NOT NULL,
	"required_approvals" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "branches_repo_name_unique" UNIQUE("repo_id","name")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" bigint PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"avatar_url" text,
	"gh_access_token" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" bigint PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"avatar_url" text NOT NULL,
	"billing_email" text,
	"installation_id" bigint NOT NULL,
	"type" text NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_status" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_installation_id_unique" UNIQUE("installation_id"),
	CONSTRAINT "organizations_stripe_customer_id_unique" UNIQUE("stripe_customer_id")
);
--> statement-breakpoint
CREATE TABLE "organization_members" (
	"org_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"slack_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_members_org_id_user_id_pk" PRIMARY KEY("org_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "repositories" (
	"id" bigint PRIMARY KEY NOT NULL,
	"org_id" bigint NOT NULL,
	"name" text NOT NULL,
	"avatar_url" text,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "repositories_org_name_unique" UNIQUE("org_id","name")
);
--> statement-breakpoint
CREATE TABLE "pull_requests" (
	"id" bigint PRIMARY KEY NOT NULL,
	"repo_id" bigint NOT NULL,
	"pr_number" bigint NOT NULL,
	"thread_ts" text,
	"is_draft" boolean DEFAULT false NOT NULL,
	"required_approvals" integer DEFAULT 0 NOT NULL,
	"approval_count" integer DEFAULT 0 NOT NULL,
	"is_queued_to_merge" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pull_requests_repo_pr_unique" UNIQUE("repo_id","pr_number")
);
--> statement-breakpoint
CREATE TABLE "slack_integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" bigint NOT NULL,
	"slack_team_id" text NOT NULL,
	"slack_team_name" text NOT NULL,
	"access_token" text NOT NULL,
	"channel_id" text NOT NULL,
	"channel_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "slack_integrations_org_team_channel_unique" UNIQUE("org_id","slack_team_id","channel_id")
);
--> statement-breakpoint
CREATE TABLE "slack_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slack_team_id" text NOT NULL,
	"slack_user_id" text NOT NULL,
	"real_name_normalized" text NOT NULL,
	"is_bot" boolean DEFAULT false NOT NULL,
	"is_owner" boolean DEFAULT false NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"email" text,
	"image_48" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "slack_users_team_user_unique" UNIQUE("slack_team_id","slack_user_id")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" bigint NOT NULL,
	"customer_id" text NOT NULL,
	"subscription_id" text NOT NULL,
	"price_id" text NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_customer_sub_unique" UNIQUE("customer_id","subscription_id")
);
--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branches_repo_id_repositories_id_fk" FOREIGN KEY ("repo_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pull_requests" ADD CONSTRAINT "pull_requests_repo_id_repositories_id_fk" FOREIGN KEY ("repo_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slack_integrations" ADD CONSTRAINT "slack_integrations_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_branches_repo" ON "branches" USING btree ("repo_id");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_organizations_installation" ON "organizations" USING btree ("installation_id");--> statement-breakpoint
CREATE INDEX "idx_organizations_customer" ON "organizations" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "idx_organization_members_org" ON "organization_members" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_organization_members_user" ON "organization_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_organization_members_slack" ON "organization_members" USING btree ("slack_id");--> statement-breakpoint
CREATE INDEX "idx_repositories_org" ON "repositories" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_repositories_enabled" ON "repositories" USING btree ("org_id","is_enabled");--> statement-breakpoint
CREATE INDEX "idx_pull_requests_repo" ON "pull_requests" USING btree ("repo_id");--> statement-breakpoint
CREATE INDEX "idx_pull_requests_thread" ON "pull_requests" USING btree ("thread_ts");--> statement-breakpoint
CREATE INDEX "idx_pull_requests_queue" ON "pull_requests" USING btree ("is_queued_to_merge");--> statement-breakpoint
CREATE INDEX "idx_slack_integrations_org" ON "slack_integrations" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_slack_integrations_team" ON "slack_integrations" USING btree ("slack_team_id");--> statement-breakpoint
CREATE INDEX "idx_slack_users_team" ON "slack_users" USING btree ("slack_team_id");--> statement-breakpoint
CREATE INDEX "idx_slack_users_expires" ON "slack_users" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_org" ON "subscriptions" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_customer" ON "subscriptions" USING btree ("customer_id");