ALTER TABLE public.github_repositories
    ADD COLUMN IF NOT EXISTS organization_id uuid NOT NULL references public.organizations(id);