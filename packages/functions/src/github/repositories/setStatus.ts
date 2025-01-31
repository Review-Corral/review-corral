import {
  fetchRepository,
  setRespositoryActiveStatus,
} from "@domain/dynamodb/fetchers/repositories";
import { Logger } from "@domain/logging";
import { useUser } from "src/utils/useUser";
import { ApiHandler } from "sst/node/api";
import * as z from "zod";

const LOGGER = new Logger("github:repositories:setStatus");

const setRepositoryActiveStatusSchema = z.object({
  repositoryId: z.string().transform((val) => Number(val)),
  organizationId: z.string().transform((val) => Number(val)),
});

export const handler = ApiHandler(async (event, _context) => {
  const { repositoryId, organizationId } = setRepositoryActiveStatusSchema.parse(
    event.pathParameters,
  );
  const { user, error } = await useUser(event, LOGGER);

  if (!user) {
    LOGGER.error("No user found in session", { error });
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized" }),
    };
  }

  const repository = await fetchRepository({
    repoId: repositoryId,
    orgId: organizationId,
  });

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
