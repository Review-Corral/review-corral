import { getDns, getUrl } from "./dns";
import { allSecrets } from "./secrets";
import { table } from "./storage";

const api = new sst.aws.ApiGatewayV2("api", {
  link: [table, ...allSecrets],
  domain: getDns("api"),
  cors: {
    // Allow requests from your frontend domain
    allowOrigins: [getUrl("frontend")],
    // Define allowed methods, headers, etc. as needed
    allowMethods: ["GET", "PUT", "POST", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  },
});

// Single Hono app that handles all routes
api.route("ANY /", "packages/functions/src/app.handler");
api.route("ANY /{proxy+}", "packages/functions/src/app.handler");

export { api };
