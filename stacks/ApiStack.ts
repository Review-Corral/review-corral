import { Api, ApiRouteProps, StackContext } from "sst/constructs";

export const HOSTED_ZONE = "review-corral.com";

export const PROD_STAGE = "prod";

const domain = (app: StackContext["app"]) => {
  if (app.stage.startsWith(PROD_STAGE)) return HOSTED_ZONE;

  return `${app.stage}-api.${HOSTED_ZONE}`;
};

export function ApiStack({ stack, app }: StackContext) {
  const api = new Api(stack, "api", {
    customDomain: {
      domainName: domain(app),
      hostedZone: HOSTED_ZONE,
    },
    routes: {
      "GET /": "packages/functions/src/lambda.handler",
      "GET /profile": "packages/functions/src/todo.getUser",

      ...buildPaths("/gh", {
        // Handles incoming webhooks from Github
        "POST /webhook-event": "packages/functions/src/github/events.handler",
        ...buildPaths("installations", {
          "GET /":
            "packages/functions/src/github/installations.getInstallations",
          "GET /{organizationId}/repositories":
            "packages/functions/src/github/repositories/getAll.handler",
        }),
        "PUT /repositories/{repositoryId}":
          "packages/functions/src/github/repositories/setStatus.handler",
      }),

      ...buildPaths("/slack", {
        "GET /oauth": "packages/functions/src/slack/oauth.handler",
        "GET /{organizationId}/installations":
          "packages/functions/src/slack/installations.getSlackInstallations",
      }),
    },
  });

  stack.addOutputs({
    apiEndpoint: api.url,
    apiDomainUrl: api.customDomainUrl,
  });

  return {
    api,
  };
}

const buildPaths = <T extends ApiRouteProps<string>>(
  basePath: string,
  routes: Record<string, T>
) =>
  Object.keys(routes).reduce((acc, key) => {
    const splitKey = key.split(" ");

    if (splitKey.length !== 2) {
      throw Error(
        `Invalid route key of '${key}' found.` +
          `Should contain a method and then the path like so: 'GET /path'`
      );
    }

    // Ignore trailing slashes
    const newKey = `${splitKey[0]} ${basePath}${
      splitKey[1] === "/" ? "" : splitKey[1]
    }`;

    return {
      ...acc,
      [newKey]: routes[key],
    };
  }, {});
