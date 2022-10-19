# Review Corral Slack Bot

## Development
1. Install hookdeck and run it to forward events to port 4000 for testing events from Github `hookdeck listen 8080`
2. Run the server with `yarn dev`

## Github Access tokens

### Knowing what repositories a Github App is installed in
The process to know what repository(ies) the Github App is installed in is quite
a complicated process.

1. Download the private key `.pem`
2. Generate a JWT using the dowloaded `.pem` key `../generate-github-jwt.rb`
3. Hit `https://api.github.com/user/installations` with the `access_token` of the user
you're trying to see what repositories they have installed. This will give you the
`installation_id`
4. Use the `installation_id` and JWT from step to to hit
 `https://api.github.com/app/installations/{{_.installation_id}}/access_tokens`. This
 will give you an installation `access_token`.
5. Use the installation access token to hit `https://api.github.com/app/installations`
where you will get the information about the installed apps.


## Dockerizing
Got the docker image working, but live updating isnt' working. Need to get the saved files
to map over to the container somehow. 

## Getting a dump file

Steps here: https://supabase.com/docs/guides/database/migrating-between-projects#migrate-the-database
### OLD:
Using `pg_dump` will result in a `pg_dump: error: server version: 14.5 (Debian 14.5-1.pgdg110+1); pg_dump version: 13.8`

Use:
`/usr/local/Cellar/postgresql@14/14.5/bin/pg_dump postgresql://postgres:postgres@localhost:54322/postgres  > data.sql`