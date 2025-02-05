export const jwtSecret = new sst.Secret("JWT_SECRET");

export const ghAppId = new sst.Secret("GH_APP_ID");
export const ghClientId = new sst.Secret("GH_CLIENT_ID");
export const ghClientSecret = new sst.Secret("GH_CLIENT_SECRET");
export const ghEncodedPem = new sst.Secret("GH_ENCODED_PEM");
export const ghWebhookSecret = new sst.Secret("GH_WEBHOOK_SECRET");

export const stripeSecretKey = new sst.Secret("STRIPE_SECRET_KEY");
export const stripeWebhookSecret = new sst.Secret("STRIPE_WEBHOOK_SECRET");

export const slackBotId = new sst.Secret("SLACK_BOT_ID");
export const slackBotToken = new sst.Secret("SLACK_BOT_TOKEN");
export const slackClientSecret = new sst.Secret("SLACK_CLIENT_SECRET");
export const slackSigningSecret = new sst.Secret("SLACK_SIGNING_SECRET");

export const posthogKey = new sst.Secret("POSTHOG_KEY");
export const posthogHost = new sst.Secret("POSTHOG_HOST");

export const allSecrets = [
  jwtSecret,
  ghAppId,
  ghClientId,
  ghClientSecret,
  ghEncodedPem,
  ghWebhookSecret,
  stripeSecretKey,
  stripeWebhookSecret,
  slackBotId,
  slackBotToken,
  slackClientSecret,
  slackSigningSecret,
  posthogKey,
  posthogHost,
];
