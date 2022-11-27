alter table public.github_repositories enable row level security;
create policy "GH repository belongs to user's organization"
  on public.github_repositories
  for ALL
  using (
    auth.uid() in (
      select user_id from users_and_organizations
      where org_id = organization_id
    )
  );


alter table public.username_mappings enable row level security;
create policy "ALL Username mappings belongs to user's organization"
  on public.username_mappings
  for ALL
  using (
    auth.uid() in (
      select user_id from users_and_organizations
      where org_id = organization_id
    )
  );


alter table public.slack_integration enable row level security;
create policy "ALL slack integration belongs to user's organization"
  on public.slack_integration
  for ALL
  using (
    auth.uid() in (
      select user_id from users_and_organizations
      where org_id = organization_id
    )
  );