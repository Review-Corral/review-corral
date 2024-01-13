import { SSTConfig } from "sst";
import { AuthStack } from "./stacks/AuthStack";
import { FrontendStack } from "./stacks/FrontendStack";
import { MainStack } from "./stacks/MainStack";

export default {
  config(_input) {
    return {
      name: "review-corral",
      region: "us-east-1",
      profile: "rc",
    };
  },
  stacks(app) {
    app.stack(MainStack).stack(AuthStack).stack(FrontendStack);
  },
} satisfies SSTConfig;
