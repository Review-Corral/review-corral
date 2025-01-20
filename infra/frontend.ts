import { HOSTED_ZONE, api } from "./api";

export const getFrontendUrl = () => {
  if ($dev) return "http://localhost:3000";

  if ($app.stage === "prod") return `${HOSTED_ZONE}`;

  return `${$app.stage}.${HOSTED_ZONE}`;
};

const frontendUrl = getFrontendUrl();

export const frontend = new sst.aws.Nextjs("frontend", {
  path: "packages/web",
  domain: $dev
    ? undefined
    : {
        name: frontendUrl,
        aliases: [`www.${frontendUrl}`],
      },
  environment: {
    BASE_URL: $dev ? frontendUrl : `https://${frontendUrl}`,
    NEXT_PUBLIC_API_URL: api.url,
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
