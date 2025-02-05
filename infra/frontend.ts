import { getDns, getUrl } from "./dns";

import { ghClientId, posthogHost, posthogKey, slackBotId } from "./secrets";

export const frontend = new sst.aws.Nextjs("frontend", {
  path: "packages/web",
  domain: getDns("frontend"),
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
    // ...slackEnvVars, // TODO:
    ...($app.stage === "alex" ? { NEXT_PUBLIC_LOCAL: "true" } : {}),
    NEXT_PUBLIC_POSTHOG_KEY: posthogKey.value,
    NEXT_PUBLIC_POSTHOG_HOST: posthogHost.value,
  },
  link: [ghClientId],
});
