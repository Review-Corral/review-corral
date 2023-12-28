import { SecurityGroup } from "aws-cdk-lib/aws-ec2";
import { Api, FunctionProps, StackContext, use } from "sst/constructs";
import { PersistedStack } from "./PersistedStack";
import { getDbConnectionInfo } from "./constructs/Database";
import MigrationFunction from "./constructs/MigrationFunction";

export function MainStack({ stack, app }: StackContext) {
  const { vpc, database } = use(PersistedStack);

  let functionsSecurityGroup: SecurityGroup | undefined =
    !!vpc && !!database
      ? new SecurityGroup(stack, "FunctionsSecurityGroup", {
          vpc,
        })
      : undefined;

  const functionDefaults: FunctionProps = {
    architecture: "x86_64",
    vpc: vpc,
    securityGroups: functionsSecurityGroup
      ? [functionsSecurityGroup]
      : undefined,
    environment: {
      IS_LOCAL: app.local.toString(),
      MIGRATIONS_PATH: "packages/core/src/database/migrations",
      ...(database ? getDbConnectionInfo(app, database) : {}),
    },
    runtime: "nodejs18.x",
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
    },
  });

  stack.addOutputs({
    ApiEndpoint: api.url,
    MigrationFunction: migrationFunction.functionName,
  });
}
