import { getInstallationAccessToken } from "../../../core/github/fetchers";
import { Logger } from "../../../core/logging";

const LOGGER = new Logger("admin/installationAccessToken");

/**
 * Get the installation acccess token for a given installation
 * This function is expected to be called from the SST console by simply putting the
 * desired installationId in as the payload. No JSON or more is needed.
 */
export const handler = async (installationId?: number) => {
  LOGGER.debug("Got event", { arg: installationId });

  if (!installationId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "No installationId provided" }),
    };
  }

  const result = await getInstallationAccessToken(installationId);

  return {
    statusCode: 201,
    body: JSON.stringify({ result }),
  };
};
