alter table public.users owner to postgres;

create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;


$$ language plpgsql security definer;

DROP TRIGGER IF EXISTS on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
