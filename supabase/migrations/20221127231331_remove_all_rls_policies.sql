drop policy if exists "ALL slack integration belongs to user's organization" on public.slack_integration;
drop policy if exists "ALL Username mappings belongs to user's organization" on public.username_mappings;
drop policy if exists "GH repository belongs to user's organization" on public.github_repositories;

alter table public.username_mappings disable row level security;
alter table public.slack_integration disable row level security;