import { api } from "./api";
import { authRouter } from "./auth";

export const frontend = new sst.aws.Nextjs("frontend", {
  path: "packages/web",
  domain: {
    name: "reviewcorral.com",
    // dns: sst.aws.dns({ override: true }),
  },
  environment: {
    NEXT_PUBLIC_API_URL: api.url,
    NEXT_PUBLIC_REGION: $app.providers.aws.region,
    NEXT_PUBLIC_AUTH_URL: authRouter.url,
    NEXT_PUBLIC_STRIPE_PRICE_ID:
      $app.stage === "prod"
        ? "price_1P8CmKBqa9UplzHebShipTnE"
        : "price_1P9FpDBqa9UplzHeeJ57VHoc",
    // ...slackEnvVars, // TODO:
    ...($app.stage === "alex" ? { NEXT_PUBLIC_LOCAL: "true" } : {}),
  },
});
