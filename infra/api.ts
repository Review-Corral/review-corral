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
api.route("POST /gh/webhook-event", `${basePath}/github/events.handler`);
api.route("GET /gh/installations", `${basePath}/github/installations.getInstallations`);
api.route(
  "GET /gh/{organizationId}/repositories",
  `${basePath}/github/repositories/getAll.handler`,
);
api.route(
  "PUT /gh/{organizationId}/repositories/{repositoryId}",
  `${basePath}/github/repositories/setStatus.handler`,
);

// ==============================
// Stripe
// ==============================
api.route(
  "POST /stripe/checkout-session",
  `${basePath}/stripe/checkoutSession.handler`,
);
api.route("POST /stripe/webhook-event", `${basePath}/stripe/webhookEvent.handler`);
api.route(
  "POST /stripe/billing-portal",
  `${basePath}/stripe/billingPortalSession.handler`,
);

// ==============================
// Organization
// ==============================
api.route(
  "GET /org/{organizationId}",
  `${basePath}/organization/getOrganization.handler`,
);
api.route(
  "GET /org/{organizationId}/billing",
  `${basePath}/organization/getBillingDetails.handler`,
);
api.route(
  "GET /org/{organizationId}/members",
  `${basePath}/organization/getMembers.handler`,
);
api.route(
  "PUT /org/{organizationId}/member",
  `${basePath}/organization/updateMember.handler`,
);

// ==============================
// Slack
// ==============================
api.route("ANY /slack/{proxy+}", `${basePath}/slack/routes.handler`);

export { api };
