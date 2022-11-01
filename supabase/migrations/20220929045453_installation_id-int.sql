ALTER TABLE public.github_repositories
    ALTER COLUMN installation_id TYPE integer;
ALTER TABLE IF EXISTS public.github_repositories
    ALTER COLUMN installation_id DROP DEFAULT;

COMMENT ON COLUMN public.github_repositories.installation_id
    IS 'The ID of the installation that this repo belongs to';
