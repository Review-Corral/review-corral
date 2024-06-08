# Review Corral

Review Corral is a lightweight Slack & Github bot designed to handle Github pull request notifications
in a more elegant manner to minimize noise for your Engineering team.

## Self Hosting

Coming soon... Reach out to @mclean25 if you're interested in setting this up

## The differences between Organizations and Installations

Organizations are the collections in GitHub that can have multiple repositories
associated with them. A user then "installs" a GitHub App like Review Corral on a
repo, thus creating an "installation" record. For most interactions with the Github
API, you have to use the `installationId` as opposed to the `organizationId`, which
is why we care about storing that. However, there can be multiple installations
technically for a given organization, hence we try to make associations in the database
on the orgnization since it's less volatile.

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
