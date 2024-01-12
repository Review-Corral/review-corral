import { App, StackContext, StaticSite, use } from "sst/constructs";

import { AuthStack } from "./AuthStack";
import { MainStack } from "./MainStack";
import { HOSTED_ZONE } from "./constructs/Api";

export const getFrontendUrl = ({ local, stage }: App) => {
  if (local) return "http://localhost:5173";

  if (stage === "prod") return HOSTED_ZONE;

  return `${stage}.${HOSTED_ZONE}`;
};

export function FrontendStack({ stack, app }: StackContext) {
  const {
    slackEnvVars,
    api: { api },
  } = use(MainStack);
  const { authUrl } = use(AuthStack);

  // Define our React app

  const site = new StaticSite(stack, "ReactSite", {
    path: "packages/frontend",
    buildCommand: "pnpm run build",
    buildOutput: "dist",
    customDomain: app.local
      ? undefined
      : {
          domainName: getFrontendUrl(app),
          hostedZone: HOSTED_ZONE,
        },
    // Pass in our environment variables
    environment: {
      VITE_API_URL: api.customDomainUrl ?? api.url,
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
