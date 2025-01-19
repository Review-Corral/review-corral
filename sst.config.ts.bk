import { SSTConfig } from "sst";
import { FrontendStack } from "./stacks/FrontendStack";
import { MainStack } from "./stacks/MainStack";
import { StorageStack } from "./stacks/StorageStack";

enum Stages {
  DEV = "dev",
  PROD = "prod",
}

export default {
  config(_input) {
    return {
      name: "review-corral",
      region: "us-east-1",
      profile: "rc",
    };
  },
  stacks(app) {
    app.stack(StorageStack).stack(MainStack).stack(FrontendStack);

    if (app.stage !== Stages.PROD) {
      app.setDefaultRemovalPolicy("destroy");
    } else {
      app.setDefaultRemovalPolicy("retain");
    }
  },
} satisfies SSTConfig;
