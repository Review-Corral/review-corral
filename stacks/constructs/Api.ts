import { Construct } from "constructs";
import {
  ApiRouteProps,
  App,
  FunctionProps,
  Api as SstApi,
  Stack,
} from "sst/constructs";

export const HOSTED_ZONE = "reviewcorral.com";
export const PROD_STAGE = "prod";

export class Api extends Construct {
  readonly api: SstApi;

  static getDomain(app: App) {
    if (app.stage.startsWith(PROD_STAGE)) return `api.${HOSTED_ZONE}`;

    return `${app.stage}-api.${HOSTED_ZONE}`;
  }

  constructor(
    stack: Stack,
    id: string,
    { app, functionDefaults }: { app: App; functionDefaults: FunctionProps },
  ) {
    super(stack, id);

    this.api = new SstApi(stack, "api", {
      customDomain: {
        domainName: Api.getDomain(app),
        hostedZone: HOSTED_ZONE,
      },
      defaults: {
        function: functionDefaults,
      },
      routes: {
        "GET /": "packages/functions/src/lambda.handler",
        "GET /profile": "packages/functions/src/getProfile.handler",
        ...buildPaths("/gh", {
          // Handles incoming webhooks from Github
          "POST /webhook-event": "packages/functions/src/github/events.handler",
          ...buildPaths("/installations", {
            "GET /": "packages/functions/src/github/installations.getInstallations",
          }),
          ...buildPaths("/{organizationId}/repositories", {
            "GET /": "packages/functions/src/github/repositories/getAll.handler",
            "PUT /{repositoryId}":
              "packages/functions/src/github/repositories/setStatus.handler",
          }),
        }),
        ...buildPaths("/stripe", {
          "POST /checkout-session":
            "packages/functions/src/stripe/checkoutSession.handler",
          "POST /webhook-event": "packages/functions/src/stripe/webhookEvent.handler",
          "POST /billing-portal":
            "packages/functions/src/stripe/billingPortalSession.handler",
        }),
        ...buildPaths("/org/{organizationId}", {
          "GET /": "packages/functions/src/organization/getOrganization.handler",
          "GET /billing":
            "packages/functions/src/organization/getBillingDetails.handler",
          "GET /members": "packages/functions/src/organization/getMembers.handler",
          "PUT /member": "packages/functions/src/organization/updateMember.handler",
        }),
        ...buildPaths("/slack", {
          "GET /oauth": "packages/functions/src/slack/oauth.handler",
          ...buildPaths("/{organizationId}", {
            "GET /users": "packages/functions/src/slack/getUsers.handler",
            ...buildPaths("/installations", {
              "GET /": "packages/functions/src/slack/getSlackInstallation.handler",
              "DELETE /": "packages/functions/src/slack/deleteIntegration.handler",
            }),
          }),
        }),
      },
    });
  }
}

const buildPaths = <T extends ApiRouteProps<string>>(
  basePath: string,
  routes: Record<string, T>,
) =>
  Object.keys(routes).reduce((acc, key) => {
    const splitKey = key.split(" ");

    if (splitKey.length !== 2) {
      throw Error(
        // biome-ignore lint/style/useTemplate: <explanation>
        `Invalid route key of '${key}' found.` +
          `Should contain a method and then the path like so: 'GET /path'`,
      );
    }

    // Ignore trailing slashes
    const newKey = `${splitKey[0]} ${basePath}${
      splitKey[1] === "/" ? "" : splitKey[1]
    }`;

    return {
      // biome-ignore lint/performance/noAccumulatingSpread: <explanation>
      ...acc,
      [newKey]: routes[key],
    };
  }, {});
