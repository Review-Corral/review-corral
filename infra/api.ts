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

const basePath = "packages/functions/src";

api.route("GET /", `${basePath}/lambda.handler`);
api.route("GET /auth/callback", `${basePath}/auth/callback.handler`);
api.route("GET /profile", `${basePath}/getProfile.handler`);

// ==============================
// Github
// ==============================
api.route("ANY /gh/{proxy+}", `${basePath}/github/routes.handler`);

// ==============================
// Stripe
// ==============================
api.route("ANY /stripe/{proxy+}", `${basePath}/stripe/routes.handler`);

// ==============================
// Organization
// ==============================
api.route("ANY /org/{proxy+}", `${basePath}/organization/routes.handler`);

// ==============================
// Slack
// ==============================
api.route("ANY /slack/{proxy+}", `${basePath}/slack/routes.handler`);

export { api };
