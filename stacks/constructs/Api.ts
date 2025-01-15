import { HostedZone } from "aws-cdk-lib/aws-route53";
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

    const basePath = "packages/functions/src";

    this.api = new SstApi(stack, "api", {
      customDomain: {
        domainName: Api.getDomain(app),
        cdk: {
          hostedZone: HostedZone.fromHostedZoneAttributes(stack, "MyZone", {
            hostedZoneId: "Z0854557GLD532VHXK6N",
            zoneName: "reviewcorral.com",
          }),
        },
      },
      defaults: {
        function: functionDefaults,
      },
      routes: {
        "GET /": `${basePath}/lambda.handler`,
        "GET /auth/callback": `${basePath}/auth/callback.handler`,
        "GET /profile": `${basePath}/getProfile.handler`,
        ...buildPaths("/gh", {
          // Handles incoming webhooks from Github
          "POST /webhook-event": `${basePath}/github/events.handler`,
          ...buildPaths("/installations", {
            "GET /": `${basePath}/github/installations.getInstallations`,
          }),
          ...buildPaths("/{organizationId}/repositories", {
            "GET /": `${basePath}/github/repositories/getAll.handler`,
            "PUT /{repositoryId}": `${basePath}/github/repositories/setStatus.handler`,
          }),
        }),
        ...buildPaths("/stripe", {
          "POST /checkout-session": `${basePath}/stripe/checkoutSession.handler`,
          "POST /webhook-event": `${basePath}/stripe/webhookEvent.handler`,
          "POST /billing-portal": `${basePath}/stripe/billingPortalSession.handler`,
        }),
        ...buildPaths("/org/{organizationId}", {
          "GET /": `${basePath}/organization/getOrganization.handler`,
          "GET /billing": `${basePath}/organization/getBillingDetails.handler`,
          "GET /members": `${basePath}/organization/getMembers.handler`,
          "PUT /member": `${basePath}/organization/updateMember.handler`,
        }),
        ...buildPaths("/slack", {
          "GET /oauth": `${basePath}/slack/oauth.handler`,
          ...buildPaths("/{organizationId}", {
            "GET /users": `${basePath}/slack/getUsers.handler`,
            ...buildPaths("/installations", {
              "GET /": `${basePath}/slack/installations.getSlackInstallations`,
              "DELETE /": `${basePath}/slack/deleteIntegration.handler`,
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
