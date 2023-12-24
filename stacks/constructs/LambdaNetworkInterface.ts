import { ISubnet } from "aws-cdk-lib/aws-ec2";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import {
  AwsCustomResource,
  AwsCustomResourcePolicy,
  AwsSdkCall,
  PhysicalResourceId,
} from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";

const ENI_ID_PATH = "NetworkInterfaces.0.NetworkInterfaceId";

interface LambdaNetworkInterfaceOptions {
  lambdaFunction: IFunction;
  subnet: ISubnet;
}

/**
 * For retrieving an existing elastic network interface as it corresponds to a specific
 * Lambda function and subnet.
 */
export default class LambdaNetworkInterface extends Construct {
  readonly networkInterfaceId: string;

  /**
   * The constructor is not callable directly since this construct doesn't actually
   * create the corresponding resource in AWS. Execute `fromLookup` instead.
   */
  private constructor(
    scope: Construct,
    id: string,
    networkInterfaceId: string
  ) {
    super(scope, id);

    this.networkInterfaceId = networkInterfaceId;
  }

  static fromLookup(
    scope: Construct,
    id: string,
    options: LambdaNetworkInterfaceOptions
  ): LambdaNetworkInterface {
    const awsSdkCallOptions: AwsSdkCall = {
      service: "EC2",
      action: "describeNetworkInterfaces",
      parameters: {
        Filters: [
          {
            Name: "interface-type",
            Values: ["lambda"],
          },
          {
            Name: "subnet-id",
            Values: [options.subnet.subnetId],
          },
          {
            Name: "group-id",
            Values: options.lambdaFunction.connections.securityGroups.map(
              (value) => value.securityGroupId
            ),
          },
        ],
      },
      physicalResourceId: PhysicalResourceId.fromResponse(ENI_ID_PATH),
    };

    // A custom resource automatically creates a Lambda function to execute the
    // specified AWS SDK call for each deploy event type
    const awsCustomResource = new AwsCustomResource(
      scope,
      `${id}CustomResource`,
      {
        onCreate: awsSdkCallOptions,
        onUpdate: awsSdkCallOptions,
        policy: AwsCustomResourcePolicy.fromSdkCalls({
          resources: AwsCustomResourcePolicy.ANY_RESOURCE, // wildcard is required for ENI
        }),
      }
    );

    // This DependsOn relationship ensures at least one Lambda function (and the
    // corresponding ENIs that are automatically provisioned by AWS for said Lambda
    // function) exists before the custom resource's AWS SDK call tries to access the
    // Lambda ENIs
    awsCustomResource.node.addDependency(
      options.lambdaFunction.node.defaultChild as Construct
    );

    return new LambdaNetworkInterface(
      scope,
      id,
      awsCustomResource.getResponseField(ENI_ID_PATH)
    );
  }
}
