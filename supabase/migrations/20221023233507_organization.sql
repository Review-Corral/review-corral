CREATE TABLE "organizations" (
  "id" uuid PRIMARY KEY,
  "account_name" text NOT NULL,
  "account_id" text UNIQUE NOT NULL,
  "installation_id" text UNIQUE NOT NULL,
  "avatar_url" text NOT NULL,
  "updated_at" timestamptz DEFAULT (now()),
  "created_at" timestamptz DEFAULT (now())
);

create trigger organizations_updated_at before update on public.organizations 
  for each row execute procedure moddatetime (updated_at);

CREATE TABLE "users_and_organizations" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid NOT NULL references public.users(id),
  "org_id" uuid NOT NULL references public.organizations(id),
  "updated_at" timestamptz DEFAULT (now()),
  "created_at" timestamptz DEFAULT (now()) 
);

CREATE UNIQUE INDEX unique_user_and_org 
  ON public.users_and_organizations (user_id, org_id);

create trigger users_and_organizations_updated_at before update on public.users_and_organizations 
  for each row execute procedure moddatetime (updated_at);

ALTER TABLE "username_mappings"
    ADD COLUMN "organization_id" uuid references public.organizations(id);

ALTER TABLE "pull_requests"
    ADD COLUMN "organization_id" uuid references public.organizations(id);

ALTER TABLE "slack_integration"
    ADD COLUMN "organization_id" uuid references public.organizations(id);

--
-- Update defaults for updated at
-- 
ALTER TABLE "username_mappings" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "slack_integration" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "users" ALTER COLUMN "updated_at" SET DEFAULT now();