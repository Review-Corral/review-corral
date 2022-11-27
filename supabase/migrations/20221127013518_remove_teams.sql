DROP TABLE IF EXISTS public.users_and_teams;

DROP TABLE IF EXISTS public.team CASCADE;

ALTER TABLE public.slack_integration
    DROP COLUMN team_id;