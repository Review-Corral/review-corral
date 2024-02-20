import { Db } from "../../dynamodb/client";
import {
  Repository,
  RepositoryInsertArgs,
} from "../../dynamodb/entities/types";

export const fetchRepositoriesForOrganization = async (
  organizationId: number
): Promise<Repository[]> =>
  await Db.entities.repository.query
    .primary({
      orgId: organizationId,
    })
    .go({
      pages: "all",
    })
    .then(({ data }) => data);

export const insertRepository = async (
  args: RepositoryInsertArgs
): Promise<Repository> => {
  return await Db.entities.repository
    .create(args)
    .go()
    .then(({ data }) => data);
};

export const removeRepository = async ({
  orgId,
  repoId,
}: {
  orgId: number;
  repoId: number;
}): Promise<void> => {
  await Db.entities.repository.delete({ orgId, repoId }).go();
};

/**
 * Sets the active status of a repository
 */
export const setRespositoryActiveStatus = async ({
  orgId,
  repoId,
  isEnabled,
}: Required<Pick<Repository, "repoId" | "isEnabled" | "orgId">>) => {
  await Db.entities.repository
    .patch({ orgId, repoId })
    .set({
      isEnabled,
    })
    .go();
};

export const safeFetchRepository = async ({
  orgId,
  repoId,
}: {
  orgId: number;
  repoId: number;
}): Promise<Repository | undefined> => {
  return (
    (await Db.entities.repository
      .get({ orgId, repoId })
      .go()
      .then(({ data }) => data)) ?? undefined
  );
};

export const fetchRepository = async ({
  orgId,
  repoId,
}: {
  orgId: number;
  repoId: number;
}): Promise<Repository> => {
  const result = await safeFetchRepository({ orgId, repoId });
  if (!result) {
    throw new Error(
      `Repository not found for orgId: ${orgId} and repoId: ${repoId}`
    );
  }

  return result;
};
