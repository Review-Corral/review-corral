import { CfnEIP, CfnEIPAssociation, Vpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { Function as SstFunction, Stack as SstStack } from "sst/constructs";
import LambdaNetworkInterface from "../constructs/lambdaPermissions/LambdaNetworkInterface";

/**
 * Configures outbound internet access for Lambda functions in a VPC without requiring
 * NAT Gateways. Any arbitrary Lambda function will suffice as a parameter to this
 * function; it is used to determine which network interfaces need to be associated with
 * Elastic IPs.
 */
export function enableLambdaOutboundNetworking(
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
