import { SecurityGroup, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { Stack, StackContext } from "sst/constructs";
import ProvisionedDatabase from "../constructs/Database";

interface PersistentStackResult {
  vpc: Vpc | undefined;
  database: ProvisionedDatabase | undefined;
  functionsSecurityGroup: SecurityGroup | undefined;
}
export function buildPersistedResources({
  stack,
  app,
}: StackContext): PersistentStackResult {
  if (app.local) {
    return {
      vpc: undefined,
      database: undefined,
      functionsSecurityGroup: undefined,
    };
  }
  const vpc: Vpc = buildVpc(stack);

  const database = new ProvisionedDatabase(stack, "db", {
    vpc,
    isLocal: app.local,
  });
  const functionsSecurityGroup = new SecurityGroup(
    stack,
    "FunctionsSecurityGroup",
    {
      vpc,
    }
  );

  database.allowInboundAccess(functionsSecurityGroup);

  return {
    vpc,
    database,
    functionsSecurityGroup,
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
