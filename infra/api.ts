import { getDns, getUrl } from "./dns";
import { frontend } from "./frontend";
import { allSecrets } from "./secrets";
import { table } from "./storage";

const api = new sst.aws.ApiGatewayV2("api", {
  link: [table, frontend, ...allSecrets],
  domain: getDns("api"),
  cors: {
    allowOrigins: [getUrl("frontend")],
  },
});

// Single Hono app that handles all routes
api.route("ANY /", "packages/functions/src/app.handler");
api.route("ANY /{proxy+}", "packages/functions/src/app.handler");

export { api };
