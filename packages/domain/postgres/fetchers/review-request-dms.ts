import { and, desc, eq } from "drizzle-orm";
import { db } from "../client";
import {
  type NewReviewRequestDm,
  type ReviewRequestDm,
  reviewRequestDms,
} from "../schema";

/**
 * Insert a new review request DM record.
 * Always creates a new record to support re-requesting reviewers.
 */
export async function insertReviewRequestDm(
  data: NewReviewRequestDm,
): Promise<ReviewRequestDm> {
  const result = await db.insert(reviewRequestDms).values(data).returning();
  return result[0];
}

/**
 * Find the latest review request DM by PR ID and reviewer username.
 * Returns the most recent record by createdAt for updating when a review is submitted.
 */
export async function findReviewRequestDm({
  pullRequestId,
  reviewerGithubUsername,
}: {
  pullRequestId: number;
  reviewerGithubUsername: string;
}): Promise<ReviewRequestDm | null> {
  const result = await db
    .select()
    .from(reviewRequestDms)
    .where(
      and(
        eq(reviewRequestDms.pullRequestId, pullRequestId),
        eq(reviewRequestDms.reviewerGithubUsername, reviewerGithubUsername),
      ),
    )
    .orderBy(desc(reviewRequestDms.createdAt))
    .limit(1);

  return result[0] ?? null;
}
