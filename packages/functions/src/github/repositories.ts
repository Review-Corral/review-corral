import ky from "ky";
import { useUser } from "src/utils/useUser";
import { ApiHandler } from "sst/node/api";
import * as z from "zod";
import {
  fetchRepositoriesForInstallation,
  insertRepository,
  removeRepository,
} from "../../../core/db/fetchers/repositories";
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

  const allInstallRepos = await fetchRepositoriesForInstallation(
    installationId
  );

  const allInstalledRepoIds = allInstallRepos.map((repo) => repo.id);

  const reposToInsert = repositories.repositories.filter(
    (repo) => !(repo.id in allInstalledRepoIds)
  );

  const reposToRemove = allInstalledRepoIds.filter(
    (id) => !(id in repositories.repositories)
  );

  LOGGER.debug("Repos to insert/delete: ", {
    reposToInsert,
    reposToRemove,
  });

  // This is less effecient, but I'm inserting these one at a time so that we can do
  // an onConflictDoUpdate. This allows us to handle the edge case that the there was
  // a new installation setup for the same organization, which would result in us having
  // repos in the database for an old installation and now we'd be trying to insert them
  // again (and they'd have the same Ids)
  for (const repoToInsert of reposToInsert) {
    await insertRepository({
      id: repoToInsert.id,
      name: repoToInsert.name,
      installationId,
      isActive: false,
    });
  }

  for (const repoToRemoveId of reposToRemove) {
    await removeRepository(repoToRemoveId);
  }
};
