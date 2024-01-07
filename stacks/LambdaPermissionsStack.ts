import { CfnEIP, CfnEIPAssociation, Vpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import {
  Function as SstFunction,
  Stack as SstStack,
  StackContext,
  use,
} from "sst/constructs";

import { MainStack } from "./MainStack";
import LambdaNaming from "./constructs/LambdaNaming";
import LambdaNetworkInterface from "./constructs/LambdaNetworkInterface";
import LambdaPermissions from "./constructs/LambdaPermissions";

/**
 * This stack must be called at the end of the stack list (or at least after all
 * lambdas that you want with access to the VPC are defined)
 */
export function LambdaPermissionStack({ stack, app }: StackContext) {
  const { vpc, functionsSecurityGroup, database, migrationFunction } =
    use(MainStack);

  new LambdaNaming(stack, "LambdaNaming");
  new LambdaPermissions(stack, "LambdaPermissions", {
    secretArns: database ? [database.secret.secretArn] : [],
  });

  if (vpc && functionsSecurityGroup) {
    // It doesn't really matter which Lambda function is passed in here; one is needed
    // simply to determine which network interfaces need Elastic IPs
    enableLambdaOutboundNetworking(stack, vpc, migrationFunction);
  }
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
