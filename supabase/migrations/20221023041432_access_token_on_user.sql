ALTER TABLE public.users
    ADD COLUMN gh_access_token text;

ALTER TABLE public.users
    ADD COLUMN gh_refresh_token text;