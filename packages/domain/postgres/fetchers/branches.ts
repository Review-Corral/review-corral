import { and, eq } from "drizzle-orm";
import { db } from "../client";
import { type Branch, type NewBranch, branches } from "../schema";

/**
 * Get a branch by repoId and branch name (returns null if not found)
 */
export async function fetchBranch({
	repoId,
	branchName,
}: {
	repoId: number;
	branchName: string;
}): Promise<Branch | null> {
	const result = await db
		.select()
		.from(branches)
		.where(and(eq(branches.repoId, repoId), eq(branches.name, branchName)));

	return result[0] ?? null;
}

/**
 * Create a new branch
 */
export async function insertBranch(data: NewBranch): Promise<Branch> {
	const result = await db.insert(branches).values(data).returning();
	return result[0];
}

/**
 * Update branch required approvals
 */
export async function updateBranch({
	branchName,
	repoId,
	requiredApprovals,
}: {
	branchName: string;
	repoId: number;
	requiredApprovals: number;
}): Promise<void> {
	await db
		.update(branches)
		.set({ requiredApprovals })
		.where(and(eq(branches.repoId, repoId), eq(branches.name, branchName)));
}
