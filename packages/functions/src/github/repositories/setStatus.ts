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
  repositoryId: z.string(),
});

export const handler = ApiHandler(async (event, context) => {
  const { repositoryId } = setRepositoryActiveStatusSchema.parse(
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

  const usersOrganizations = await fetchUsersOrganizations(user.userId);

  const repository = await fetchRepository(Number(repositoryId));

  // Ensure that the repository is associated with one of the users organizations
  if (
    !usersOrganizations.some((org) => org.orgId === repository.organizationId)
  ) {
    return {
      statusCode: 403,
      body: JSON.stringify({ message: "Forbidden" }),
    };
  }

  await setRespositoryActiveStatus({
    id: repository.id,
    isActive: !repository.isActive,
  });

  return {
    statusCode: 200,
    body: JSON.stringify({}),
  };
});
