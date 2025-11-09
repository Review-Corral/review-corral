import { getDns, getUrl } from "./dns";

import { ghClientId, posthogHost, posthogKey, slackBotId } from "./secrets";

const dns = getDns("frontend");

export const frontend = new sst.aws.TanStackStart("frontend", {
  path: "packages/web",
  buildCommand: "pnpm build",
  domain: dns,
  environment: {
    VITE_BASE_URL: getUrl("frontend"),
    VITE_API_URL: getUrl("api"),
    VITE_REGION: $app.providers!.aws.region,
    VITE_GITHUB_CLIENT_ID: ghClientId.value,
    VITE_SLACK_BOT_ID: slackBotId.value,
    VITE_LOCAL: $dev ? "true" : "false",
    VITE_STRIPE_PRICE_ID:
      $app.stage === "prod"
        ? "price_1P8CmKBqa9UplzHebShipTnE"
        : "price_1P9FpDBqa9UplzHeeJ57VHoc",
    VITE_POSTHOG_KEY: posthogKey.value,
    VITE_POSTHOG_HOST: posthogHost.value,
    VITE_GITHUB_APP_URL: `https://github.com/apps/${$app.stage === "prod" ? "review-corral" : "review-corral-dev"}`,
    ...($app.stage === "alex" ? { VITE_LOCAL: "true" } : {}),
  },
});
