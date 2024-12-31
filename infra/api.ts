import { auth } from "./auth";
import { table } from "./storage";

export const HOSTED_ZONE = "reviewcorral.com";
export const PROD_STAGE = "prod";

export function getDomain(stage: string) {
  if (stage.startsWith(PROD_STAGE)) return `api.${HOSTED_ZONE}`;

  return `${stage}-api.${HOSTED_ZONE}`;
}

export const api = new sst.aws.ApiGatewayV2("api", {
  // domain: "api.reviewcorral.com", // TODO: add after deploying
  // dns: sst.aws.dns({ override: true })
  link: [table, auth],
});

const basePath = "packages/functions/src";

api.route("GET /", `${basePath}/lambda.handler`);
api.route("GET /profile", `${basePath}/getProfile.handler`);

// ==============================
// Auth
// ==============================
// we're creating a lambda here because this is a Hono app
const authApi = new sst.aws.Function("LambdaApi", {
  handler: "packages/functions/src/auth/client.handler",
  url: true,
  environment: {
    OPENAUTH_ISSUER: auth.url.apply((v) => v!.replace(/\/$/, "")),
  },
});
api.route("GET /auth", authApi.arn);

// ==============================
// Github
// ==============================
api.route("GET /gh/webhook-event", `${basePath}/github/events.handler`);
api.route("GET /gh/installations", `${basePath}/github/installations.getInstallations`);
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
api.route("GET /slack/oauth", `${basePath}/slack/oauth.handler`);
api.route("GET /slack/{organizationId}/users", `${basePath}/slack/getUsers.handler`);
api.route(
  "GET /slack/{organizationId}/installations",
  `${basePath}/slack/installations.getSlackInstallations`,
);
api.route(
  "DELETE /slack/{organizationId}/installations",
  `${basePath}/slack/deleteIntegration.handler`,
);
