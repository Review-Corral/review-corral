## Testing locally

Use the "Review Corral - Test" Github app to test things locally

Run `./ngrok http 8080` to get a public URL to forward Github events to. You may
have to update the "Webhook URL" property in the Github app settings [here](https://github.com/settings/apps/review-corral-test).

Run the frontend with `cd ./frontend && p dev`
Run the backend with `cd ./backend && yarn dev`

## Auth

Auth works by redirecting from Nrgok to `api/gh/local-auth`. The redirect is necessary
so we can use one Nrgok domain for all of the tunneling. 

Make sure the Github App has the permission to read the user's email
(Account Permission -> email address). If this isn't on it will silently fail (unless
you check the supabase auth logs).

### Logs
- `docker logs -f supabase_auth_backend` to check auth logs
- `docker logs -f supabase_kong_backend` to check KONG logs

### Pem files
Github gives PEM files for signing. To get these into environment variables, run
`base64 ${pem-file-path}` and then save that result to an env variable.

#### DB Diagram
- https://dbdiagram.io/d/635572f84709410195c2cdc4