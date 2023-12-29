import { Effect, ManagedPolicy, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { Stack } from "sst/constructs";

interface LambdaPermissionsProps {
  secretArns: string[];
}

/**
 * Attaches some permissions to all Lambda functions in the stack
 */
class LambdaPermissions extends Construct {
  static readonly globalSecretNames: string[] = [];

  constructor(stack: Stack, id: string, props: LambdaPermissionsProps) {
    super(stack, id);

    const globalSecretArns = LambdaPermissions.globalSecretNames.map(
      (secretName) =>
        // Note that Secrets Manager appends a random suffix to the secret name when
        // generating a secret's ARN; match the suffix with a wildcard
        `arn:aws:secretsmanager:${stack.region}:${stack.account}:secret:${secretName}-*`
    );

    const resources = [...globalSecretArns, ...props.secretArns];

    if (resources.length > 0) {
      const policy = new ManagedPolicy(this, "LambdaPermissionsPolicy", {
        statements: [
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
              "secretsmanager:DescribeSecret",
              "secretsmanager:GetSecretValue",
            ],
            resources,
          }),
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ["states:StartExecution"],
            resources: [
              `arn:aws:states:${stack.region}:${stack.account}:stateMachine:*`,
            ],
          }),
        ],
      });

      for (const lambdaFunction of stack.getAllFunctions()) {
        lambdaFunction.role?.addManagedPolicy(policy);
      }
    }
  }
}

export default LambdaPermissions;
