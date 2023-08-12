
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER SCHEMA "extensions" OWNER TO "postgres";

CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";

ALTER SCHEMA "public" OWNER TO "postgres";

CREATE EXTENSION IF NOT EXISTS "moddatetime" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";

-- CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

CREATE TYPE "public"."organization_type" AS ENUM (
    'Organization',
    'User'
);

ALTER TYPE "public"."organization_type" OWNER TO "postgres";

ALTER FUNCTION "extensions"."grant_pg_cron_access"() OWNER TO "postgres";

ALTER FUNCTION "extensions"."grant_pg_graphql_access"() OWNER TO "supabase_admin";

ALTER FUNCTION "extensions"."grant_pg_net_access"() OWNER TO "postgres";

ALTER FUNCTION "extensions"."pgrst_ddl_watch"() OWNER TO "supabase_admin";

CREATE TABLE "public"."github_integration" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "team_id" "uuid" NOT NULL,
    "access_token" "text" NOT NULL,
    "updated_at" timestamp with time zone
);

ALTER TABLE "public"."github_integration" OWNER TO "postgres";

CREATE TABLE "public"."github_repositories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "repository_id" bigint NOT NULL,
    "repository_name" "text" NOT NULL,
    "installation_id" integer NOT NULL,
    "is_active" boolean DEFAULT false NOT NULL,
    "organization_id" "uuid" NOT NULL
);

ALTER TABLE "public"."github_repositories" OWNER TO "postgres";

CREATE TABLE "public"."organizations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "account_name" "text" NOT NULL,
    "account_id" bigint NOT NULL,
    "installation_id" bigint NOT NULL,
    "avatar_url" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "organization_type" "public"."organization_type"
);

ALTER TABLE "public"."organizations" OWNER TO "postgres";

CREATE TABLE "public"."pull_requests" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "thread_ts" "text",
    "pr_id" "text" NOT NULL,
    "organization_id" "uuid",
    "draft" boolean DEFAULT false NOT NULL
);

ALTER TABLE "public"."pull_requests" OWNER TO "postgres";

CREATE TABLE "public"."slack_integration" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "access_token" "text" NOT NULL,
    "channel_id" "text" NOT NULL,
    "channel_name" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "slack_team_name" "text" NOT NULL,
    "slack_team_id" "text" NOT NULL,
    "organization_id" "uuid" NOT NULL
);

ALTER TABLE "public"."slack_integration" OWNER TO "postgres";

CREATE TABLE "public"."username_mappings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "github_username" "text" NOT NULL,
    "slack_user_id" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "organization_id" "uuid"
);

ALTER TABLE "public"."username_mappings" OWNER TO "postgres";

CREATE TABLE "public"."users" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "email" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "gh_access_token" "text",
    "gh_refresh_token" "text"
);

ALTER TABLE "public"."users" OWNER TO "postgres";

CREATE TABLE "public"."users_and_organizations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "org_id" "uuid" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."users_and_organizations" OWNER TO "postgres";

ALTER TABLE ONLY "public"."github_integration"
    ADD CONSTRAINT "github_integration_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."github_integration"
    ADD CONSTRAINT "github_integration_team_id_key" UNIQUE ("team_id");

ALTER TABLE ONLY "public"."github_repositories"
    ADD CONSTRAINT "github_repositories_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."github_repositories"
    ADD CONSTRAINT "github_repositories_repository_id_key" UNIQUE ("repository_id");

ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_account_id_key" UNIQUE ("account_id");

ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_installation_id_key" UNIQUE ("installation_id");

ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."pull_requests"
    ADD CONSTRAINT "pull_requests_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."pull_requests"
    ADD CONSTRAINT "pull_requests_thread_ts_key" UNIQUE ("thread_ts");

ALTER TABLE ONLY "public"."slack_integration"
    ADD CONSTRAINT "slack_integration_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."pull_requests"
    ADD CONSTRAINT "unique_pr_id" UNIQUE ("pr_id");

ALTER TABLE ONLY "public"."username_mappings"
    ADD CONSTRAINT "username_mappings_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."username_mappings"
    ADD CONSTRAINT "username_mappings_slack_username_key" UNIQUE ("slack_user_id");

ALTER TABLE ONLY "public"."users_and_organizations"
    ADD CONSTRAINT "users_and_organizations_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

CREATE UNIQUE INDEX "unique_user_and_org" ON "public"."users_and_organizations" USING "btree" ("user_id", "org_id");

CREATE TRIGGER "handle_updated_at" BEFORE UPDATE ON "public"."github_integration" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');

CREATE TRIGGER "handle_updated_at" BEFORE UPDATE ON "public"."github_repositories" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');

CREATE TRIGGER "handle_updated_at" BEFORE UPDATE ON "public"."slack_integration" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');

CREATE TRIGGER "handle_updated_at" BEFORE UPDATE ON "public"."username_mappings" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');

CREATE TRIGGER "handle_updated_at_github_repositories" BEFORE UPDATE ON "public"."github_repositories" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');

CREATE TRIGGER "organizations_updated_at" BEFORE UPDATE ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');

CREATE TRIGGER "users_and_organizations_updated_at" BEFORE UPDATE ON "public"."users_and_organizations" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');

CREATE TRIGGER "users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');

ALTER TABLE ONLY "public"."github_repositories"
    ADD CONSTRAINT "github_repositories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id");

ALTER TABLE ONLY "public"."pull_requests"
    ADD CONSTRAINT "pull_requests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id");

ALTER TABLE ONLY "public"."slack_integration"
    ADD CONSTRAINT "slack_integration_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id");

ALTER TABLE ONLY "public"."username_mappings"
    ADD CONSTRAINT "username_mappings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id");

ALTER TABLE ONLY "public"."users_and_organizations"
    ADD CONSTRAINT "users_and_organizations_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");

ALTER TABLE ONLY "public"."users_and_organizations"
    ADD CONSTRAINT "users_and_organizations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";

CREATE OR REPLACE FUNCTION public.insert_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

RESET ALL;
