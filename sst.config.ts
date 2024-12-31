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
    await import("./infra/api");
    await import("./infra/storage");
    await import("./infra/api");
    await import("./infra/auth");
  },
});
