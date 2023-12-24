import { SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { Stack, StackContext } from "sst/constructs";
import ProvisionedDatabase from "./constructs/Database";

interface PersistentStackResult {
  vpc: Vpc | undefined;
  database: ProvisionedDatabase | undefined;
}

export function PersistedStack({
  stack,
  app,
}: StackContext): PersistentStackResult {
  const { vpc, database } = buildEnvDependantResources({ stack, app });

  stack.addOutputs({
    vpcId: vpc?.vpcId,
    databaseId: database?.instance.instanceResourceId,
  });

  return {
    vpc,
    database,
  };
}

function buildEnvDependantResources({
  stack,
  app,
}: StackContext): PersistentStackResult {
  if (app.local) {
    return {
      vpc: undefined,
      database: undefined,
    };
  }
  const vpc: Vpc = buildVpc(stack);

  const database = new ProvisionedDatabase(stack, "db", {
    vpc,
    isLocal: app.local,
  });
  return {
    vpc,
    database,
  };
}

const buildVpc = (stack: Stack): Vpc => {
  const vpc = new Vpc(stack, `Vpc`, {
    maxAzs: 2,
    natGateways: 0,
    subnetConfiguration: [
      { name: "Public", subnetType: SubnetType.PUBLIC, cidrMask: 19 },
      {
        name: "Private",
        subnetType: SubnetType.PRIVATE_ISOLATED,
        cidrMask: 19,
      },
    ],
  });

  return vpc;
};
