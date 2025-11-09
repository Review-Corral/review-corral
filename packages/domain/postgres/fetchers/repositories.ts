import { and, eq } from "drizzle-orm";
import { db } from "../client";
import { type NewRepository, type Repository, repositories } from "../schema";

/**
 * Repository with compatibility alias for repoId
 * TODO: remove this type, just here for easier migration from dynamodb
 *
 */
export type RepositoryWithAlias = Repository & {
  repoId: number; // Alias for id for DynamoDB compatibility
};

function toRepositoryWithAlias(repo: Repository): RepositoryWithAlias {
  return {
    ...repo,
    repoId: repo.id,
  };
}

/**
 * Get all repositories for an organization
 */
export async function fetchRepositoriesForOrganization(
  organizationId: number,
): Promise<RepositoryWithAlias[]> {
  const result = await db
    .select()
    .from(repositories)
    .where(eq(repositories.orgId, organizationId));

  return result.map(toRepositoryWithAlias);
}

/**
 * Get a repository by ID and orgId (returns undefined if not found)
 */
export async function safeFetchRepository({
  orgId,
  repoId,
}: {
  orgId: number;
  repoId: number;
}): Promise<RepositoryWithAlias | undefined> {
  const result = await db
    .select()
    .from(repositories)
    .where(and(eq(repositories.orgId, orgId), eq(repositories.id, repoId)));

  return result[0] ? toRepositoryWithAlias(result[0]) : undefined;
}

/**
 * Get a repository by ID and orgId (throws if not found)
 */
export async function fetchRepository({
  orgId,
  repoId,
}: {
  orgId: number;
  repoId: number;
}): Promise<RepositoryWithAlias> {
  const result = await safeFetchRepository({ orgId, repoId });
  if (!result) {
    throw new Error(`Repository not found for orgId: ${orgId} and repoId: ${repoId}`);
  }
  return result;
}

/**
 * Create a new repository (upserts on conflict to handle re-installations)
 */
export async function insertRepository(
  data: NewRepository,
): Promise<RepositoryWithAlias> {
  const result = await db
    .insert(repositories)
    .values(data)
    .onConflictDoUpdate({
      target: [repositories.orgId, repositories.name],
      set: {
        avatarUrl: data.avatarUrl,
        isEnabled: data.isEnabled ?? true,
      },
    })
    .returning();

  return toRepositoryWithAlias(result[0]);
}

/**
 * Delete a repository
 */
export async function removeRepository({
  orgId,
  repoId,
}: {
  orgId: number;
  repoId: number;
}): Promise<void> {
  await db
    .delete(repositories)
    .where(and(eq(repositories.orgId, orgId), eq(repositories.id, repoId)));
}

/**
 * Update repository enabled status
 */
export async function setRepositoryActiveStatus({
  orgId,
  repoId,
  isEnabled,
}: {
  orgId: number;
  repoId: number;
  isEnabled: boolean;
}): Promise<void> {
  await db
    .update(repositories)
    .set({ isEnabled })
    .where(and(eq(repositories.orgId, orgId), eq(repositories.id, repoId)));
}
