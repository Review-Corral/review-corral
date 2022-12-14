# About
Review Corral is an opinonated tool to effectively organize pull request events from
Github in Slack.

## Features:
1. Events for pull requests are organized into Slack threads to limit event notifications
to only the participants of the thread.
2. Username mappings translate the Github event usernames to Slack usernames to automatically
notify and subscribe the appropriate users in Slack. 
3. [Coming soon] Scheduling of messages for reviews that are still open and awaiting reviews.

## Testing locally

In order to test Review Corral locally, you'll need to setup a few things.
1. Create a copy of the Review Corral Github & Slack apps via the provided manifests (coming soon).
2. Install the [Supabase CLI](https://supabase.com/docs/guides/cli).
3. Setup your local config (coming soon.)

## Miscellaneous Notes
### Auth

Auth works by redirecting from Nrgok to `api/gh/local-auth`. The redirect is necessary
so we can use one Nrgok domain for all of the tunneling. 

Make sure the Github App has the permission to read the user's email
(Account Permission -> email address). If this isn't on it will silently fail (unless
you check the supabase auth logs).

### Logs
- `docker logs -f supabase_auth_backend` to check auth logs
- `docker logs -f supabase_kong_backend` to check KONG logs