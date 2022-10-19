
ALTER TABLE public.users 
    ADD COLUMN gh_access_token TEXT;

ALTER TABLE public.users
    ADD COLUMN updated_at timestamp with time zone;

create trigger users_updated_at before update on public.users 
  for each row execute procedure moddatetime (updated_at);

ALTER TABLE public.team
    ADD COLUMN installation_id text UNIQUE;

ALTER TABLE public.team
    ADD COLUMN installation_image_url text;

