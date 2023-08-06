# About

Review Corral is an opinonated tool to effectively organize pull request events from
Github in Slack.

## Features

1. Events for pull requests are organized into Slack threads to limit event notifications
to only the participants of the thread.
1. Username mappings translate the Github event usernames to Slack usernames to automatically
notify and subscribe the appropriate users in Slack. 
1. [Coming soon] Scheduling of messages for reviews that are still open and awaiting reviews.

## Testing locally

In order to test Review Corral locally, you'll need to setup a few things:

1. Create a copy of the Review Corral Github & Slack apps via the provided manifests
   (coming soon).
1. Run `cp ./supabase/.env.example` `./supabase.env`
1. From the Github app you've added, copy the Client ID and Client secret to the
   `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in `./supabase.env` variables respectfully
1. Install the [Supabase CLI](https://supabase.com/docs/guides/cli).
1. Run `supabase start`

### Using the Supabase CLI

Everytime you use the supabase CLI, you'll need to run `source ./supabase.env` before
hand in order to load the Github keys in for auth to work.

### Auth

Auth works by redirecting from Nrgok to `api/gh/local-auth`. The redirect is necessary
so we can use one Nrgok domain for all of the tunneling. See the
`[auth.external.github]`
section in `./supabase/config.toml` for where this is configured.

Make sure the Github App has the permission to read the user's email
(Account Permission -> email address). If this isn't on it will silently fail (unless
you check the supabase auth logs).

### Logs

- `docker logs -f supabase_auth_backend` to check auth logs
- `docker logs -f supabase_kong_backend` to check KONG logs
