import { getDns, getUrl } from "./dns";
import { frontend } from "./frontend";
import { allSecrets } from "./secrets";
import { table } from "./storage";

// Standalone function to test Sentry - invoke manually via AWS console or CLI
new sst.aws.Function("TestSentry", {
  handler: "packages/functions/src/testSentry.handler",
  description: "Test function to verify Sentry error reporting",
});

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
