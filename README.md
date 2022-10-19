## Testing locally

Use the "Review Corral - Test" Github app to test things locally

Run `./ngrok http 8080` to get a public URL to forward Github events to. You may
have to update the "Webhook URL" property in the Github app settings [here](https://github.com/settings/apps/review-corral-test).

Run the frontend with `cd ./frontend && p dev`
Run the backend with `cd ./backend && yarn dev`


### Pem files
Github gives PEM files for signing. To get these into environment variables, run
`base64 ${pem-file-path}` and then save that result to an env variable.


### Notes
- User authenticates with GH
- [Next screen] User then onboards with creating GH access token (installing in some place)
- [Next screen] For all installations, a team is created