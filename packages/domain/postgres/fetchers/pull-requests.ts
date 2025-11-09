import { and, eq } from "drizzle-orm";
import { db } from "../client";
import {
	type NewPullRequest,
	type PullRequest,
	pullRequests,
} from "../schema";

/**
 * Pull request with compatibility alias for prId
 * TODO: remove this type, just here for easier migration from dynamodb
 */
export type PullRequestWithAlias = PullRequest & {
	prId: number; // Alias for id for DynamoDB compatibility
};

function toPullRequestWithAlias(pr: PullRequest): PullRequestWithAlias {
	return {
		...pr,
		prId: pr.id,
	};
}

/**
 * Get a pull request by prId and repoId (returns null if not found)
 */
export async function fetchPrItem({
	pullRequestId,
	repoId,
}: {
	pullRequestId: number;
	repoId: number;
}): Promise<PullRequestWithAlias | null> {
	const result = await db
		.select()
		.from(pullRequests)
		.where(
			and(eq(pullRequests.repoId, repoId), eq(pullRequests.id, pullRequestId)),
		);

	return result[0] ? toPullRequestWithAlias(result[0]) : null;
}

/**
 * Get a pull request by prId and repoId (throws if not found)
 */
export async function forceFetchPrItem({
	pullRequestId,
	repoId,
}: {
	pullRequestId: number;
	repoId: number;
}): Promise<PullRequestWithAlias> {
	const result = await fetchPrItem({ pullRequestId, repoId });
	if (!result) {
		throw new Error(
			`Could not find pull request with id: ${pullRequestId} in repoId: ${repoId}`,
		);
	}
	return result;
}

/**
 * Create a new pull request
 */
export async function insertPullRequest(
	data: NewPullRequest,
): Promise<PullRequestWithAlias> {
	const result = await db.insert(pullRequests).values(data).returning();
	return toPullRequestWithAlias(result[0]);
}

/**
 * Update a pull request
 */
export async function updatePullRequest({
	pullRequestId,
	repoId,
	...updates
}: Partial<Omit<NewPullRequest, "id" | "repoId">> & {
	pullRequestId: number;
	repoId: number;
}): Promise<void> {
	await db
		.update(pullRequests)
		.set(updates)
		.where(
			and(eq(pullRequests.repoId, repoId), eq(pullRequests.id, pullRequestId)),
		);
}
