import { Auth, StackContext, use } from "sst/constructs";
import { ApiStack } from "./ApiStack";

export function AuthStack({ stack, app }: StackContext) {
  const { api } = use(ApiStack);

  const auth = new Auth(stack, "auth", {
    authenticator: {
      handler: "packages/functions/src/auth.handler",
    },
  });

  const authPostfix = "/auth";
  auth.attach(stack, { api, prefix: authPostfix });

  const authUrl = `${api.url}${authPostfix}`;

  stack.addOutputs({
    authUrl,
  });

  return {
    authUrl,
  };
}
