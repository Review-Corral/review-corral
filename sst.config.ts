/// <reference path="./.sst/platform/config.d.ts" />

import { getUrl } from "./infra/dns";

export default $config({
  app(input) {
    return {
      name: "review-corral",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: {
        aws: {
          region: "us-east-1",
          profile: "rc",
        },
      },
    };
  },
  async run() {
    const {
      jwtSecret,
      ghAppId,
      ghClientId,
      ghClientSecret,
      ghEncodedPem,
      ghWebhookSecret,
      stripeSecretKey,
      stripeWebhookSecret,
    } = await import("./infra/secrets");

    $transform(sst.aws.Function, (args, _opts) => {
      // Set the default if it's not set by the component
      if (args.runtime === undefined) {
        args.runtime = "nodejs18.x";
        args.architecture = "arm64";
        args.logging =
          $app.stage === "prod"
            ? {
                retention: "6 months",
              }
            : {
                retention: "1 week",
              };
        args.environment = {
          IS_LOCAL: $dev ? "true" : "false",
          BASE_FE_URL: getUrl("frontend"),
          BASE_API_URL: getUrl("api"),
          LOG_LEVEL: process.env.LOG_LEVEL ?? "INFO",
        };
        args.link = [
          ...(Array.isArray(args.link) ? args.link : [args.link]),
          jwtSecret,
          ghAppId,
          ghClientId,
          ghClientSecret,
          ghEncodedPem,
          ghWebhookSecret,
          stripeSecretKey,
          stripeWebhookSecret,
        ];
      }
    });

    await import("./infra/storage");
    await import("./infra/api");

    const { frontend } = await import("./infra/frontend");

    return {
      webUrl: frontend.url,
    };
  },
});
