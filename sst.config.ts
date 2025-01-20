/// <reference path="./.sst/platform/config.d.ts" />

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
      }
    });

    await import("./infra/api");
    await import("./infra/storage");
    await import("./infra/api");

    const { frontend } = await import("./infra/frontend");

    return {
      webUrl: frontend.url,
    };
  },
});
