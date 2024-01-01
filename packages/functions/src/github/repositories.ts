import ky from "ky";
import { useUser } from "src/utils/useUser";
import { ApiHandler } from "sst/node/api";
import * as z from "zod";
import { InstallationsData } from "../../../core/github/endpointTypes";
import { getInstallationRepositories } from "../../../core/github/fetchers";
import { Logger } from "../../../core/logging";

const LOGGER = new Logger("functions:installations");

const getRepositoriesForInstallationSchema = z.object({
  installationId: z.string(),
});

export const getRepositoriesForInstallation = ApiHandler(
  async (event, context) => {
    const { installationId } = getRepositoriesForInstallationSchema.parse(
      event.pathParameters
    );
    const { user, error } = await useUser();

    if (!user) {
      LOGGER.error("No user found in session", { error });
      return {
        statusCode: 401,
        body: JSON.stringify({ message: "Unauthorized" }),
      };
    }

    // Installations appear to have effectively a 1:1 mapping with organizations
    const installations = await ky
      .get("https://api.github.com/user/installations", {
        headers: {
          Authorization: `token ${user.ghAccessToken}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
      })
      .json<InstallationsData>();

    LOGGER.debug("Installations fetch response: ", { installations });

    const repositories = await getRepositories(Number(installationId));

    return {
      statusCode: 200,
      body: JSON.stringify(repositories),
    };
  }
);

const getRepositories = async (installationId: number) => {
  const repositories = await getInstallationRepositories(installationId);

  for (const repository of repositories.repositories) {
    // Check to see if the repository is already in the database
    // If it is, update the installation id if necessary
    LOGGER.info("Got repository", { repository });
  }
};
