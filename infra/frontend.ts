import { getDns, getUrl } from "./dns";

import { ghClientId, posthogHost, posthogKey, slackBotId } from "./secrets";

const dns = getDns("frontend");

export const frontend = new sst.aws.TanStackStart("frontend", {
  path: "packages/web",
  buildCommand: "pnpm build",
  domain: dns,
  environment: {
    BASE_URL: getUrl("frontend"),
    NEXT_PUBLIC_API_URL: getUrl("api"),
    NEXT_PUBLIC_REGION: $app.providers!.aws.region,
    NEXT_PUBLIC_GITHUB_CLIENT_ID: ghClientId.value,
    NEXT_PUBLIC_SLACK_BOT_ID: slackBotId.value,
    NEXT_PUBLIC_LOCAL: $dev ? "true" : "false",
    NEXT_PUBLIC_STRIPE_PRICE_ID:
      $app.stage === "prod"
        ? "price_1P8CmKBqa9UplzHebShipTnE"
        : "price_1P9FpDBqa9UplzHeeJ57VHoc",
    NEXT_PUBLIC_POSTHOG_KEY: posthogKey.value,
    NEXT_PUBLIC_POSTHOG_HOST: posthogHost.value,
    NEXT_PUBLIC_GITHUB_APP_URL: `https://github.com/apps/${$app.stage === "prod" ? "review-corral" : "review-corral-dev"}`,
    ...($app.stage === "alex" ? { NEXT_PUBLIC_LOCAL: "true" } : {}),
  },
});
