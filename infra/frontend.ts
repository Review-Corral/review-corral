import { getDns, getUrl } from "./dns";

export const frontend = new sst.aws.Nextjs("frontend", {
  path: "packages/web",
  domain: getDns("frontend"),
  environment: {
    BASE_URL: getUrl("frontend"),
    NEXT_PUBLIC_API_URL: getUrl("api"),
    NEXT_PUBLIC_REGION: $app.providers!.aws.region,
    NEXT_PUBLIC_GITHUB_CLIENT_ID: process.env.GH_CLIENT_ID!,
    NEXT_PUBLIC_LOCAL: $dev ? "true" : "false",
    NEXT_PUBLIC_STRIPE_PRICE_ID:
      $app.stage === "prod"
        ? "price_1P8CmKBqa9UplzHebShipTnE"
        : "price_1P9FpDBqa9UplzHeeJ57VHoc",
    // ...slackEnvVars, // TODO:
    ...($app.stage === "alex" ? { NEXT_PUBLIC_LOCAL: "true" } : {}),
  },
});
