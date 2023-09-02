import { SSTConfig } from "sst";
import { API } from "./stacks/MyStack";

export default {
  config(_input) {
    return {
      name: "rc-sst",
      region: "us-east-1",
      profile: "rc",
    };
  },
  stacks(app) {
    app.stack(API);
  },
} satisfies SSTConfig;
