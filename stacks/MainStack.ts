import {
  FunctionProps,
  Function as SstFunction,
  StackContext,
  use,
} from "sst/constructs";
import { getFrontendUrl } from "./FrontendStack";
import { StorageStack } from "./StorageStack";
import { Api } from "./constructs/Api";
import { assertVarExists } from "./utils/asserts";

export function MainStack({ stack, app }: StackContext) {
  const { table } = use(StorageStack);

  const slackEnvVars = {
    NEXT_PUBLIC_SLACK_BOT_ID: assertVarExists("SLACK_BOT_ID"),
    // Don't expose on the frontend
    SLACK_CLIENT_SECRET: assertVarExists("SLACK_CLIENT_SECRET"),
    NEXT_PUBLIC_SLACK_AUTH_URL: `https://${Api.getDomain(app)}/slack/oauth`,
  };

  const baseFeUrl = app.local ? getFrontendUrl(app) : `https://${getFrontendUrl(app)}`;

  const functionDefaults: FunctionProps = {
    architecture: "x86_64",
    environment: {
      // IMPORTANT: changes to this will impact auth redirects. Be careful and see
      // `auth.ts` to ensure the changes here will work
      BASE_FE_URL: baseFeUrl,
      IS_LOCAL: app.local ? "true" : "false",
      LOG_LEVEL: process.env.LOG_LEVEL ?? "INFO",
      JWT_SECRET: assertVarExists("JWT_SECRET"),
      GH_APP_ID: assertVarExists("GH_APP_ID"),
      GH_CLIENT_ID: assertVarExists("GH_CLIENT_ID"),
      GH_CLIENT_SECRET: assertVarExists("GH_CLIENT_SECRET"),
      GH_ENCODED_PEM: assertVarExists("GH_ENCODED_PEM"),
      GH_WEBHOOK_SECRET: assertVarExists("GH_WEBHOOK_SECRET"),
      STRIPE_SECRET_KEY: assertVarExists("STRIPE_SECRET_KEY"),
      STRIPE_WEBHOOK_SECRET: assertVarExists("STRIPE_WEBHOOK_SECRET"),
      ...slackEnvVars,
    },
    logRetention: app.local ? "one_week" : "one_year",
    runtime: "nodejs18.x",
    bind: [table],
  };

  stack.setDefaultFunctionProps(functionDefaults);

  new SstFunction(stack, "GetInstallationAccessToken", {
    handler: "packages/functions/src/admin/installationAccessToken.handler",
  });

  const api = new Api(stack, "Api", { app, functionDefaults });
  api.api.bind([table]);

  stack.addOutputs({
    apiUrl: api.api.customDomainUrl ?? api.api.url,
  });

  return {
    api,
    slackEnvVars,
  };
}
