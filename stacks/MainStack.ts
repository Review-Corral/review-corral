import { SubnetType } from "aws-cdk-lib/aws-ec2";
import { Api, Auth, FunctionProps, StackContext, use } from "sst/constructs";
import { getBaseUrl } from "./FrontendStack";
import { PersistedStack } from "./PersistedStack";
import { getDbConnectionInfo } from "./constructs/Database";
import MigrationFunction from "./constructs/MigrationFunction";
import { assertVarExists } from "./utils/asserts";

export function MainStack({ stack, app }: StackContext) {
  const { vpc, database, functionsSecurityGroup } = use(PersistedStack);

  // TODO: eventually we'll want to use a static API here
  // This is just done for testing while we wait for the domains to transfer
  const apiUrl: string =
    "https://e1h1w6x6r9.execute-api.us-east-1.amazonaws.com";

  const slackEnvVars = {
    VITE_SLACK_BOT_ID: assertVarExists("SLACK_BOT_ID"),
    VITE_SLACK_CLIENT_SECRET: assertVarExists("SLACK_CLIENT_SECRET"),
    VITE_SLACK_AUTH_URL: `${apiUrl}/slack/oauth`,
  };

  const functionDefaults: FunctionProps = {
    architecture: "x86_64",
    vpc: vpc,
    securityGroups: functionsSecurityGroup
      ? [functionsSecurityGroup]
      : undefined,
    environment: {
      BASE_FE_URL: getBaseUrl(app.local),
      IS_LOCAL: app.local ? "true" : "false",
      MIGRATIONS_PATH: "packages/core/src/database/migrations",
      ...slackEnvVars,
      LOG_LEVEL: process.env.LOG_LEVEL ?? "INFO",
      GH_APP_ID: assertVarExists("GH_APP_ID"),
      GH_CLIENT_ID: assertVarExists("GH_CLIENT_ID"),
      GH_CLIENT_SECRET: assertVarExists("GH_CLIENT_SECRET"),
      GH_ENCODED_PEM: assertVarExists("GH_ENCODED_PEM"),
      GH_WEBHOOK_SECRET: assertVarExists("GH_WEBHOOK_SECRET"),
      ...getDbConnectionInfo(app, database),
    },
    logRetention: app.local ? "one_week" : "one_year",
    runtime: "nodejs18.x",
    // Combined with the Elastic IP(s), these settings enable outbound internet access
    // without the need for costly NAT Gateways
    allowPublicSubnet: Boolean(vpc),
    vpcSubnets: vpc ? { subnetType: SubnetType.PUBLIC } : undefined,
  };
  stack.setDefaultFunctionProps(functionDefaults);

  const migrationFunction = new MigrationFunction(stack, "MigrateToLatest", {
    app,
    database,
    functionDefaults,
  });

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

  const auth = new Auth(stack, "auth", {
    authenticator: {
      handler: "packages/functions/src/auth.handler",
    },
  });

  const authPostfix = "/auth";
  auth.attach(stack, { api, prefix: authPostfix });

  // ===================
  // Ending Config
  // Must be at the end, after all Lambdas are defined
  // ===================

  stack.addOutputs({
    ApiEndpoint: api.url,
    MigrationFunction: migrationFunction.functionName,
  });

  return {
    api,
    authUrl: `${api.url}${authPostfix}`,
    slackEnvVars,
    vpc,
    functionsSecurityGroup,
    migrationFunction,
  };
}
