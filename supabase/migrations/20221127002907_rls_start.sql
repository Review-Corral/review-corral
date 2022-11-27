alter table organizations enable row level security;


create policy "Organization members can read organization"
  on organizations
  for select using (
    auth.uid() in (
      select user_id from users_and_organizations
      where org_id = id
    )
  );