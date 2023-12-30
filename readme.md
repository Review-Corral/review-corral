## Migrations

1. Create migration scripts by using the "Generate Migrations" task in the VSCode actions.
1. To run the migrations locally, open the SST Console and invoke the `migrateToLatest`
   function.

## Signing the JWT secrets for getting a GH Installation Accces Token

In order to generate a JWT with a signed secret, we encode the `.pem` file that we get
(somehow) from GitHub and then store that as an evironment variable:

```bash
base64 -i /path/to/your/private-key.pem | pbcopy
```

Example
```bash
base64 -i /Users/alex/ssh/review-corral/test-review-corral.2023-12-30.private-key.pem | pbcopy
```

This will copy it to your variable so that you can store it in an evironment variable.
Docs on GitHub JWT generation here: https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-json-web-token-jwt-for-a-github-app