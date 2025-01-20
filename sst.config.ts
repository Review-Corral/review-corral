/// <reference path="./.sst/platform/config.d.ts" />

import { getUrl } from "./infra/dns";
import { assertVarExists } from "./infra/utils/asserts";

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
          LOG_LEVEL: process.env.LOG_LEVEL ?? "INFO",
          JWT_SECRET: assertVarExists<string>("JWT_SECRET"),
          GH_APP_ID: assertVarExists<string>("GH_APP_ID"),
          GH_CLIENT_ID: assertVarExists<string>("GH_CLIENT_ID"),
          GH_CLIENT_SECRET: assertVarExists<string>("GH_CLIENT_SECRET"),
          GH_ENCODED_PEM: assertVarExists<string>("GH_ENCODED_PEM"),
          GH_WEBHOOK_SECRET: assertVarExists<string>("GH_WEBHOOK_SECRET"),
          STRIPE_SECRET_KEY: assertVarExists<string>("STRIPE_SECRET_KEY"),
          STRIPE_WEBHOOK_SECRET: assertVarExists<string>("STRIPE_WEBHOOK_SECRET"),
        };
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
