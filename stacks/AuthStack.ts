import { Auth, StackContext, use } from "sst/constructs";
import { MainStack } from "./MainStack";

export function AuthStack({ stack }: StackContext) {
  const {
    api: { api },
  } = use(MainStack);

  const auth = new Auth(stack, "auth", {
    authenticator: {
      handler: "packages/functions/src/auth.handler",
    },
  });

  const authPostfix = "/auth";
  auth.attach(stack, { api: api, prefix: authPostfix });

  const authUrl = `${api.customDomainUrl ?? api.url}${authPostfix}`;

  stack.addOutputs({
    authUrl,
  });

  return {
    authUrl,
  };
}
