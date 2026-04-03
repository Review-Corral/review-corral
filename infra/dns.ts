export const HOSTED_ZONE = "reviewcorral.com";
export const PROD_STAGE = "prod";
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;

export const getDomain = (service: "api" | "frontend") => {
  const isProd = $app.stage === "prod";

  const serviceDomains = {
    api: `${isProd ? "" : `${$app.stage}-`}api.${HOSTED_ZONE}`,
    auth: `${isProd ? "" : `${$app.stage}-`}auth.${HOSTED_ZONE}`,
    frontend: `${isProd ? "" : `${$app.stage}.`}${HOSTED_ZONE}`,
  };

  return serviceDomains[service];
};

export const getUrl = (service: "api" | "frontend"): string => {
  if (service === "frontend" && $dev) return "http://localhost:3000";

  return `https://${getDomain(service)}`;
};

/**
 * Generates DNS information for a given service.
 */
export const getDns = (service: "api" | "frontend") => {
  const domain = getDomain(service);
  return {
    name: domain,
    ...($app.stage === "prod" && service === "frontend"
      ? { redirects: [`www.${domain}`] }
      : {}),
    dns: sst.cloudflare.dns(
      CLOUDFLARE_ZONE_ID ? { zone: CLOUDFLARE_ZONE_ID } : undefined,
    ),
  };
};
