import {
  CfnEIP,
  CfnEIPAssociation,
  SubnetType,
  Vpc,
} from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import {
  Api,
  Auth,
  FunctionProps,
  Function as SstFunction,
  Stack as SstStack,
  StackContext,
  use,
} from "sst/constructs";
import { getBaseUrl } from "./FrontendStack";
import { PersistedStack } from "./PersistedStack";
import { getDbConnectionInfo } from "./constructs/Database";
import LambdaNaming from "./constructs/LambdaNaming";
import LambdaNetworkInterface from "./constructs/LambdaNetworkInterface";
import LambdaPermissions from "./constructs/LambdaPermissions";
import MigrationFunction from "./constructs/MigrationFunction";

export function MainStack({ stack, app }: StackContext) {
  const { vpc, database, functionsSecurityGroup } = use(PersistedStack);

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
      LOG_LEVEL: process.env.LOG_LEVEL ?? "INFO",
      GH_APP_ID: process.env.GH_APP_ID!,
      GH_CLIENT_ID: process.env.GH_CLIENT_ID!,
      GH_CLIENT_SECRET: process.env.GH_CLIENT_SECRET!,
      GH_ENCODED_PEM: process.env.GH_ENCODED_PEM!,
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
        "packages/functions/src/github/repositories.getRepositoriesForOrganization",
      "GET /slack/{organizationId}/installations":
        "packages/functions/src/slack/installations.getSlackInstallations",
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

  new LambdaNaming(stack, "LambdaNaming");
  new LambdaPermissions(stack, "LambdaPermissions", {
    secretArns: database ? [database.secret.secretArn] : [],
  });

  if (vpc && functionsSecurityGroup) {
    // It doesn't really matter which Lambda function is passed in here; one is needed
    // simply to determine which network interfaces need Elastic IPs
    enableLambdaOutboundNetworking(stack, vpc, migrationFunction);
  }

  stack.addOutputs({
    ApiEndpoint: api.url,
    MigrationFunction: migrationFunction.functionName,
  });

  return {
    api,
    authUrl: `${api.url}${authPostfix}`,
  };
}

/**
 * Configures outbound internet access for Lambda functions in a VPC without requiring
 * NAT Gateways. Any arbitrary Lambda function will suffice as a parameter to this
 * function; it is used to determine which network interfaces need to be associated with
 * Elastic IPs.
 */
function enableLambdaOutboundNetworking(
  stack: SstStack,
  vpc: Vpc,
  lambdaFunction: SstFunction
): void {
  for (const subnet of vpc.publicSubnets) {
    const lambdaEip = new CfnEIP(stack, `LambdaEIP${subnet.node.id}`);

    // Ensure the Elastic IP is released when the subnet is deleted
    lambdaEip.node.addDependency(subnet.node.defaultChild as Construct);

    const lambdaEni = LambdaNetworkInterface.fromLookup(
      stack,
      `LambdaENI${subnet.node.id}`,
      {
        lambdaFunction,
        subnet,
      }
    );

    new CfnEIPAssociation(stack, `LambdaEIPAssoc${subnet.node.id}`, {
      allocationId: lambdaEip.attrAllocationId,
      networkInterfaceId: lambdaEni.networkInterfaceId,
    });
  }
}
