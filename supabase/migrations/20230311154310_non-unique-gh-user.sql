alter table "public"."username_mappings" drop constraint "username_mappings_github_username_key";

drop index if exists "public"."username_mappings_github_username_key";