import { useUser } from "src/utils/useUser";
import { ApiHandler } from "sst/node/api";
import * as z from "zod";
import { fetchOrganizationById } from "../../../core/db/fetchers/organizations";
import {
  fetchRepositoriesForOrganization,
  insertRepository,
  removeRepository,
} from "../../../core/db/fetchers/repositories";
import { Organization, Repository } from "../../../core/db/types";
import { getInstallationRepositories } from "../../../core/github/fetchers";
import { Logger } from "../../../core/logging";

const LOGGER = new Logger("functions:installations");

const getRepositoriesForOrganizationSchena = z.object({
  organizationId: z.string(),
});

export const getRepositoriesForOrganization = ApiHandler(
  async (event, context) => {
    const { organizationId } = getRepositoriesForOrganizationSchena.parse(
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

    const organization = await fetchOrganizationById(Number(organizationId));

    if (!organization) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Organization not found" }),
      };
    }

    const repositories = await getRepositories(organization);

    return {
      statusCode: 200,
      body: JSON.stringify(repositories),
    };
  }
);

const getRepositories = async (
  organization: Organization
): Promise<Repository[]> => {
  const repositories = await getInstallationRepositories(
    organization.installationId
  );

  const allInstallRepos = await fetchRepositoriesForOrganization(
    organization.id
  );

  const allInstalledRepoIds = allInstallRepos.map((repo) => repo.id);

  const allOriginRepoIds = repositories.repositories.map((repo) => repo.id);

  const reposToInsert = repositories.repositories.filter(
    (repo) => !allInstalledRepoIds.includes(repo.id)
  );
  const reposToRemove = allInstalledRepoIds.filter(
    (id) => !allOriginRepoIds.includes(id)
  );

  const reposToReturn = allInstallRepos.filter((repo) =>
    allOriginRepoIds.includes(repo.id)
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
    reposToReturn.push(
      await insertRepository({
        id: repoToInsert.id,
        name: repoToInsert.name,
        organizationId: organization.id,
        isActive: false,
      })
    );
  }

  for (const repoToRemoveId of reposToRemove) {
    await removeRepository(repoToRemoveId);
  }

  return reposToReturn;
};
