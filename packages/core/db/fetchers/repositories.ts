import { eq } from "drizzle-orm";
import { DB } from "../db";
import { repositories } from "../schema";
import { Repository, RepositoryInsertArgs } from "../types";

/**
 * Fetches all repositories for a given installationId
 */
export const fetchRepositoriesForInstallation = async (
  installationId: number
): Promise<Repository[]> =>
  await DB.select()
    .from(repositories)
    .where(eq(repositories.installationId, installationId));

export const insertRepository = async (
  args: RepositoryInsertArgs
): Promise<void> => {
  await DB.insert(repositories)
    .values(args)
    .onConflictDoUpdate({
      target: [repositories.id],
      set: args,
    });
};

export const removeRepository = async (id: number): Promise<void> => {
  await DB.delete(repositories).where(eq(repositories.id, id));
};
