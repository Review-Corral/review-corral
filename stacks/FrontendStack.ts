import { App, NextjsSite, StackContext, use } from "sst/constructs";

import { AuthStack } from "./AuthStack";
import { MainStack } from "./MainStack";
import { StorageStack } from "./StorageStack";
import { HOSTED_ZONE } from "./constructs/Api";
import { HostedZone } from "aws-cdk-lib/aws-route53";

export const getFrontendUrl = ({ local, stage }: App) => {
  if (local) return "http://localhost:3000";

  if (stage === "prod") return `${HOSTED_ZONE}`;

  return `${stage}.${HOSTED_ZONE}`;
};

export function FrontendStack({ stack, app }: StackContext) {
  const { slackEnvVars, api } = use(MainStack);
  // Just here to try and fix typing
  const { table } = use(StorageStack);
  const { authUrl } = use(AuthStack);

  const frontendUrl = getFrontendUrl(app);

  const site = new NextjsSite(stack, "NextJsSite", {
    path: "packages/web",
    customDomain: app.local
      ? undefined
      : {
          domainName: frontendUrl,
          domainAlias: `www.${frontendUrl}`,
          cdk: {
            hostedZone: HostedZone.fromHostedZoneAttributes(stack, "MyZone", {
              hostedZoneId: "Z0854557GLD532VHXK6N",
              zoneName: "reviewcorral.com",
            }),
          },
        },
    bind: [table],
    // Pass in our environment variables
    environment: {
      NEXT_PUBLIC_API_URL: api.api.customDomainUrl ?? api.api.url,
      NEXT_PUBLIC_REGION: app.region,
      NEXT_PUBLIC_AUTH_URL: authUrl,
      NEXT_PUBLIC_STRIPE_PRICE_ID:
        stack.stage === "prod"
          ? "price_1P8CmKBqa9UplzHebShipTnE"
          : "price_1P9FpDBqa9UplzHeeJ57VHoc",
      ...slackEnvVars,
      ...(app.local ? { NEXT_PUBLIC_LOCAL: "true" } : {}),
    },
  });

  // Show the url in the output
  stack.addOutputs({
    SiteUrl: site.url,
  });
}
