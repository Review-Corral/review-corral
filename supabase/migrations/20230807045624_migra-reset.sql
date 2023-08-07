create extension if not exists "moddatetime" with schema "extensions";


create type "public"."organization_type" as enum ('Organization', 'User');

create table "public"."github_integration" (
    "id" uuid not null default uuid_generate_v4(),
    "created_at" timestamp with time zone default now(),
    "team_id" uuid not null,
    "access_token" text not null,
    "updated_at" timestamp with time zone
);


create table "public"."github_repositories" (
    "id" uuid not null default uuid_generate_v4(),
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "repository_id" bigint not null,
    "repository_name" text not null,
    "installation_id" integer not null,
    "is_active" boolean not null default false,
    "organization_id" uuid not null
);


create table "public"."organizations" (
    "id" uuid not null default uuid_generate_v4(),
    "account_name" text not null,
    "account_id" bigint not null,
    "installation_id" bigint not null,
    "avatar_url" text not null,
    "updated_at" timestamp with time zone default now(),
    "created_at" timestamp with time zone default now(),
    "organization_type" organization_type
);


create table "public"."pull_requests" (
    "id" uuid not null default uuid_generate_v4(),
    "created_at" timestamp with time zone default now(),
    "thread_ts" text,
    "pr_id" text not null,
    "organization_id" uuid,
    "draft" boolean not null default false
);


create table "public"."slack_integration" (
    "id" uuid not null default uuid_generate_v4(),
    "created_at" timestamp with time zone not null default now(),
    "access_token" text not null,
    "channel_id" text not null,
    "channel_name" text not null,
    "updated_at" timestamp with time zone not null default now(),
    "slack_team_name" text not null,
    "slack_team_id" text not null,
    "organization_id" uuid not null
);


create table "public"."username_mappings" (
    "id" uuid not null default uuid_generate_v4(),
    "created_at" timestamp with time zone default now(),
    "github_username" text not null,
    "slack_user_id" text not null,
    "updated_at" timestamp with time zone default now(),
    "organization_id" uuid
);


create table "public"."users" (
    "id" uuid not null default uuid_generate_v4(),
    "created_at" timestamp with time zone default now(),
    "email" text,
    "updated_at" timestamp with time zone default now(),
    "gh_access_token" text,
    "gh_refresh_token" text
);


create table "public"."users_and_organizations" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "org_id" uuid not null,
    "updated_at" timestamp with time zone default now(),
    "created_at" timestamp with time zone default now()
);


CREATE UNIQUE INDEX github_integration_pkey ON public.github_integration USING btree (id);

CREATE UNIQUE INDEX github_integration_team_id_key ON public.github_integration USING btree (team_id);

CREATE UNIQUE INDEX github_repositories_pkey ON public.github_repositories USING btree (id);

CREATE UNIQUE INDEX github_repositories_repository_id_key ON public.github_repositories USING btree (repository_id);

CREATE UNIQUE INDEX organizations_account_id_key ON public.organizations USING btree (account_id);

CREATE UNIQUE INDEX organizations_installation_id_key ON public.organizations USING btree (installation_id);

CREATE UNIQUE INDEX organizations_pkey ON public.organizations USING btree (id);

CREATE UNIQUE INDEX pull_requests_pkey ON public.pull_requests USING btree (id);

CREATE UNIQUE INDEX pull_requests_thread_ts_key ON public.pull_requests USING btree (thread_ts);

CREATE UNIQUE INDEX slack_integration_pkey ON public.slack_integration USING btree (id);

CREATE UNIQUE INDEX unique_pr_id ON public.pull_requests USING btree (pr_id);

CREATE UNIQUE INDEX unique_user_and_org ON public.users_and_organizations USING btree (user_id, org_id);

CREATE UNIQUE INDEX username_mappings_pkey ON public.username_mappings USING btree (id);

CREATE UNIQUE INDEX username_mappings_slack_username_key ON public.username_mappings USING btree (slack_user_id);

CREATE UNIQUE INDEX users_and_organizations_pkey ON public.users_and_organizations USING btree (id);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

alter table "public"."github_integration" add constraint "github_integration_pkey" PRIMARY KEY using index "github_integration_pkey";

alter table "public"."github_repositories" add constraint "github_repositories_pkey" PRIMARY KEY using index "github_repositories_pkey";

alter table "public"."organizations" add constraint "organizations_pkey" PRIMARY KEY using index "organizations_pkey";

alter table "public"."pull_requests" add constraint "pull_requests_pkey" PRIMARY KEY using index "pull_requests_pkey";

alter table "public"."slack_integration" add constraint "slack_integration_pkey" PRIMARY KEY using index "slack_integration_pkey";

alter table "public"."username_mappings" add constraint "username_mappings_pkey" PRIMARY KEY using index "username_mappings_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."users_and_organizations" add constraint "users_and_organizations_pkey" PRIMARY KEY using index "users_and_organizations_pkey";

alter table "public"."github_integration" add constraint "github_integration_team_id_key" UNIQUE using index "github_integration_team_id_key";

alter table "public"."github_repositories" add constraint "github_repositories_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) not valid;

alter table "public"."github_repositories" validate constraint "github_repositories_organization_id_fkey";

alter table "public"."github_repositories" add constraint "github_repositories_repository_id_key" UNIQUE using index "github_repositories_repository_id_key";

alter table "public"."organizations" add constraint "organizations_account_id_key" UNIQUE using index "organizations_account_id_key";

alter table "public"."organizations" add constraint "organizations_installation_id_key" UNIQUE using index "organizations_installation_id_key";

alter table "public"."pull_requests" add constraint "pull_requests_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) not valid;

alter table "public"."pull_requests" validate constraint "pull_requests_organization_id_fkey";

alter table "public"."pull_requests" add constraint "pull_requests_thread_ts_key" UNIQUE using index "pull_requests_thread_ts_key";

alter table "public"."pull_requests" add constraint "unique_pr_id" UNIQUE using index "unique_pr_id";

alter table "public"."slack_integration" add constraint "slack_integration_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) not valid;

alter table "public"."slack_integration" validate constraint "slack_integration_organization_id_fkey";

alter table "public"."username_mappings" add constraint "username_mappings_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) not valid;

alter table "public"."username_mappings" validate constraint "username_mappings_organization_id_fkey";

alter table "public"."username_mappings" add constraint "username_mappings_slack_username_key" UNIQUE using index "username_mappings_slack_username_key";

alter table "public"."users_and_organizations" add constraint "users_and_organizations_org_id_fkey" FOREIGN KEY (org_id) REFERENCES organizations(id) not valid;

alter table "public"."users_and_organizations" validate constraint "users_and_organizations_org_id_fkey";

alter table "public"."users_and_organizations" add constraint "users_and_organizations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) not valid;

alter table "public"."users_and_organizations" validate constraint "users_and_organizations_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;


$function$
;

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.github_integration FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.github_repositories FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');

CREATE TRIGGER handle_updated_at_github_repositories BEFORE UPDATE ON public.github_repositories FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');

CREATE TRIGGER organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.slack_integration FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.username_mappings FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');

CREATE TRIGGER users_and_organizations_updated_at BEFORE UPDATE ON public.users_and_organizations FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');


