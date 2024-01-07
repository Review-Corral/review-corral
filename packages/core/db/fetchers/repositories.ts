import { eq } from "drizzle-orm";
import { DB } from "../db";
import { repositories } from "../schema";
import { Repository, RepositoryInsertArgs } from "../types";
import { takeFirst, takeFirstOrThrow } from "./utils";

export const fetchRepositoriesForOrganization = async (
  organizationId: number
): Promise<Repository[]> =>
  await DB.select()
    .from(repositories)
    .where(eq(repositories.organizationId, organizationId));

export const insertRepository = async (
  args: RepositoryInsertArgs
): Promise<Repository> => {
  return await DB.insert(repositories)
    .values(args)
    .onConflictDoUpdate({
      target: [repositories.id],
      set: args,
    })
    .returning()
    .then(takeFirstOrThrow);
};

export const removeRepository = async (id: number): Promise<void> => {
  await DB.delete(repositories).where(eq(repositories.id, id));
};

/**
 * Sets the active status of a repository
 */
export const setRespositoryActiveStatus = async ({
  id,
  isActive,
}: Required<Pick<Repository, "id" | "isActive">>) => {
  await DB.update(repositories)
    .set({ isActive })
    .where(eq(repositories.id, id));
};

export const safeFetchRepository = async (
  id: number
): Promise<Repository | undefined> => {
  return await DB.select()
    .from(repositories)
    .where(eq(repositories.id, id))
    .limit(1)
    .then(takeFirst);
};

export const fetchRepository = async (id: number): Promise<Repository> => {
  return await DB.select()
    .from(repositories)
    .where(eq(repositories.id, id))
    .limit(1)
    .then(takeFirstOrThrow);
};
