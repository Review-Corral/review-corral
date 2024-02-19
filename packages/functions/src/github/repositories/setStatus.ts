import { useUser } from "src/utils/useUser";
import { ApiHandler } from "sst/node/api";
import * as z from "zod";
import { fetchUsersOrganizations } from "../../../../core/db/fetchers/organizations";
import {
  fetchRepository,
  setRespositoryActiveStatus,
} from "../../../../core/db/fetchers/repositories";
import { Logger } from "../../../../core/logging";

const LOGGER = new Logger("github:repositories:setStatus");

const setRepositoryActiveStatusSchema = z.object({
  repositoryId: z.string().transform((val) => Number(val)),
  organizationId: z.string().transform((val) => Number(val)),
});

export const handler = ApiHandler(async (event, context) => {
  const { repositoryId, organizationId } =
    setRepositoryActiveStatusSchema.parse(event.pathParameters);
  const { user, error } = await useUser();

  if (!user) {
    LOGGER.error("No user found in session", { error });
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized" }),
    };
  }

  const usersOrganizations = await fetchUsersOrganizations(user.userId);

  const repository = await fetchRepository({
    repoId: repositoryId,
    orgId: organizationId,
  });

  // Ensure that the repository is associated with one of the users organizations
  if (!usersOrganizations.some((org) => org.orgId === repository.orgId)) {
    return {
      statusCode: 403,
      body: JSON.stringify({ message: "Forbidden" }),
    };
  }

  await setRespositoryActiveStatus({
    orgId: repository.orgId,
    repoId: repository.repoId,
    isEnabled: !repository.isEnabled,
  });

  return {
    statusCode: 200,
    body: JSON.stringify({}),
  };
});
