ALTER TABLE IF EXISTS public.slack_integration
    ADD updated_at timestamp with time zone;

create trigger handle_updated_at before update on public.slack_integration 
  for each row execute procedure moddatetime (updated_at);


ALTER TABLE IF EXISTS public.team
    ADD updated_at timestamp with time zone;

create trigger handle_updated_at before update on public.team 
  for each row execute procedure moddatetime (updated_at);


ALTER TABLE IF EXISTS public.username_mappings
    ADD updated_at timestamp with time zone;

create trigger handle_updated_at before update on public.username_mappings 
  for each row execute procedure moddatetime (updated_at);