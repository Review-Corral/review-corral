import { Construct } from "constructs";
import { Stack } from "sst/constructs";

class LambdaNaming extends Construct {
  constructor(stack: Stack, id: string) {
    super(stack, id);

    for (const lambdaFunction of stack.getAllFunctions()) {
      // The Lambda ID is quite a friendly name, but all the API Gateway lambdas start
      // with "Lambda_" for some reason. Just cleaning that up here
      lambdaFunction.addEnvironment(
        "FRIENDLY_NAME",
        lambdaFunction.id.replace(/^Lambda_/, "")
      );
    }
  }
}

export default LambdaNaming;
