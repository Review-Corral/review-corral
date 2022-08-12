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
