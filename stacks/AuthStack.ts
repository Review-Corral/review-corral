import { Auth, StackContext, use } from "sst/constructs";
import { MainStack } from "./MainStack";
import LambdaPolicies from "./constructs/lambdaPermissions/LambdaPolicies";

export function AuthStack({ stack }: StackContext) {
  const {
    api: { api },
    database,
  } = use(MainStack);

  const auth = new Auth(stack, "auth", {
    authenticator: {
      handler: "packages/functions/src/auth.handler",
    },
  });

  const authPostfix = "/auth";
  auth.attach(stack, { api: api, prefix: authPostfix });

  const authUrl = `${api.customDomainUrl ?? api.url}${authPostfix}`;

  // Needs to be done after ALL lambdas are created
  new LambdaPolicies(stack, "LambdaPermissions", {
    secretArns: database ? [database.secret.secretArn] : [],
  });

  stack.addOutputs({
    authUrl,
  });

  return {
    authUrl,
  };
}
