import { StackContext, StaticSite, use } from "sst/constructs";

import { MainStack } from "./MainStack";

export const getBaseUrl = (isLocal: boolean) => {
  if (isLocal) return "http://localhost:5173";

  // TODO: use the proper domain.
  return "https://alexmclean.ca";
};

export function FrontendStack({ stack, app }: StackContext) {
  const { api, authUrl, slackEnvVars } = use(MainStack);

  // Define our React app
  const site = new StaticSite(stack, "ReactSite", {
    path: "packages/frontend",
    buildCommand: "pnpm run build",
    buildOutput: "dist",
    // Pass in our environment variables
    environment: {
      VITE_API_URL: api.url,
      VITE_REGION: app.region,
      VITE_AUTH_URL: authUrl,
      ...slackEnvVars,
      ...(app.local ? { VITE_LOCAL: "true" } : {}),
    },
  });

  // Show the url in the output
  stack.addOutputs({
    SiteUrl: site.url,
  });
}
