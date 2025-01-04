const baseDomain = "reviewcorral.com";

/**
 * Generates DNS information for a given service.
 */
export const getDns = (service: "api" | "auth" | "frontend") => {
  const isProd = $app.stage === "prod";

  const serviceDomains = {
    api: `${isProd ? "" : `${$app.stage}-`}api.${baseDomain}`,
    auth: `${isProd ? "" : `${$app.stage}-`}auth.${baseDomain}`,
    frontend: `${isProd ? "" : `${$app.stage}.`}${baseDomain}`,
  };

  const name = serviceDomains[service];

  return {
    domain: {
      name,
      dns: sst.aws.dns({
        override: true,
        zone: "Z0854557GLD532VHXK6N",
      }),
    },
  };
};
