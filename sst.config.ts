/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  console: {
    autodeploy: {
      target: (event) => {
        if (
          event.type === "branch" &&
          event.action === "pushed" &&
          event.branch === "main"
        ) {
          return {
            stage: "dev",
          };
        }
      },
    },
  },
  app(input) {
    return {
      name: "review-corral",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: {
        aws: {
          region: "us-east-1",
          ...(process.env.CI ? {} : { profile: "rc" }),
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
      neonDatabaseUrl,
      posthogKey,
      posthogHost,
    } = await import("./infra/secrets");

    const { getUrl } = await import("./infra/dns");

    $transform(sst.aws.Function, (args, _opts) => {
      // Set the default if it's not set by the component
      if (args.runtime === undefined) {
        args.runtime = "nodejs22.x";
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
          neonDatabaseUrl,
          posthogKey,
          posthogHost,
        ];
      }
    });

    const { table } = await import("./infra/storage");
    await import("./infra/api");
    await import("./infra/alerts");
    await import("./infra/cron");

    const { frontend } = await import("./infra/frontend");

    new sst.x.DevCommand("ElectroViewer", {
      link: [table],
      dev: {
        autostart: true,
        command: "pnpm electro-viewer",
      },
    });

    return {
      webUrl: frontend.url,
    };
  },
});
