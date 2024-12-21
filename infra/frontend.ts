export const frontend = new sst.aws.Nextjs("frontend", {
  domain: {
    name: "reviewcorral.com",
    dns: sst.aws.dns({ override: true }),
  },
  // environment: {
  //   NEXT_PUBLIC_API_URL: api.api.customDomainUrl ?? api.api.url,
  //   NEXT_PUBLIC_REGION: app.region,
  //   NEXT_PUBLIC_AUTH_URL: authUrl,
  //   NEXT_PUBLIC_STRIPE_PRICE_ID:
  //     $app.stage === "prod"
  //       ? "price_1P8CmKBqa9UplzHebShipTnE"
  //       : "price_1P9FpDBqa9UplzHeeJ57VHoc",
  //   ...slackEnvVars,
  //   ...(app.local ? { NEXT_PUBLIC_LOCAL: "true" } : {}),
  // }
});
