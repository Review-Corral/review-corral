import { Api, StackContext } from "sst/constructs";

export function ApiStack({ stack, app }: StackContext) {
  const api = new Api(stack, "api", {
    routes: {
      "GET /": "packages/functions/src/lambda.handler",
      "GET /todo": "packages/functions/src/todo.list",
      "POST /todo": "packages/functions/src/todo.create",
      "GET /profile": "packages/functions/src/todo.getUser",
      "GET /gh/installations":
        "packages/functions/src/github/installations.getInstallations",
      "GET /gh/installations/{organizationId}/repositories":
        "packages/functions/src/github/repositories/getAll.handler",
      "PUT /gh/repositories/{repositoryId}":
        "packages/functions/src/github/repositories/setStatus.handler",
      "GET /slack/{organizationId}/installations":
        "packages/functions/src/slack/installations.getSlackInstallations",
      "GET /slack/oauth": "packages/functions/src/slack/oauth.handler",
    },
  });

  stack.addOutputs({
    apiEndpoint: api.url,
  });

  return {
    api,
  };
}
