import { App, NextjsSite, StackContext, StaticSite, use } from "sst/constructs";

import { AuthStack } from "./AuthStack";
import { MainStack } from "./MainStack";
import { HOSTED_ZONE } from "./constructs/Api";

export const getFrontendUrl = ({ local, stage }: App) => {
  if (local) return "http://localhost:3001";

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

  const viteEnvVars = {
    VITE_API_URL: api.customDomainUrl ?? api.url,
    VITE_REGION: app.region,
    VITE_AUTH_URL: authUrl,
    ...slackEnvVars,
    ...(app.local ? { VITE_LOCAL: "true" } : {}),
  };

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
    environment: viteEnvVars,
  });

  const nextjsEnvVars = transformKeys(viteEnvVars);

  console.log({ nextjsEnvVars });

  const nextJsSite = new NextjsSite(stack, "NextJsSite", {
    path: "packages/web",
    buildCommand: "pnpm run build",
    // Pass in our environment variables
    environment: nextjsEnvVars,
  });

  // Show the url in the output
  stack.addOutputs({
    SiteUrl: site.url,
    NextJsSiteUrl: nextJsSite.url,
  });
}

/**
 * Transforms object keys from starting with "VITE" to "NEXT_PUBLIC".
 * @param obj - The object to transform.
 * @returns A new object with transformed keys.
 */
function transformKeys(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};

  Object.keys(obj).forEach((key) => {
    if (key.startsWith("VITE")) {
      const newKey = key.replace("VITE", "NEXT_PUBLIC");
      result[newKey] = obj[key];
    } else {
      result[key] = obj[key];
    }
  });

  return result;
}
