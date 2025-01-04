const baseDomain = "reviewcorral.com";

/**
 * Generates DNS information for a given service.
 */
export const getDns = (
  service: "api" | "auth" | "frontend",
  { override = false } = {},
) => {
  const isProd = $app.stage === "prod";

  const serviceDomains = {
    api: `${isProd ? "" : `${$app.stage}-`}api.${baseDomain}`,
    auth: `${isProd ? "" : `${$app.stage}-`}auth.${baseDomain}`,
    frontend: `${isProd ? "" : `${$app.stage}.`}${baseDomain}`,
  };

  const name = serviceDomains[service];

  return {
    name,
    dns: sst.aws.dns({
      override,
      zone: "Z0854557GLD532VHXK6N",
    }),
  };
};
