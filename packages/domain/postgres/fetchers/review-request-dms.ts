import { and, eq } from "drizzle-orm";
import { db } from "../client";
import {
  type NewReviewRequestDm,
  type ReviewRequestDm,
  reviewRequestDms,
} from "../schema";

/**
 * Insert or update a review request DM record.
 * Uses upsert to handle re-requesting review on the same PR.
 */
export async function upsertReviewRequestDm(
  data: NewReviewRequestDm,
): Promise<ReviewRequestDm> {
  const result = await db
    .insert(reviewRequestDms)
    .values(data)
    .onConflictDoUpdate({
      target: [reviewRequestDms.pullRequestId, reviewRequestDms.reviewerGithubUsername],
      set: {
        slackChannelId: data.slackChannelId,
        slackMessageTs: data.slackMessageTs,
      },
    })
    .returning();
  return result[0];
}

/**
 * Find a review request DM by PR ID and reviewer username.
 * Used when a review is submitted to find the DM to update.
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
    .limit(1);

  return result[0] ?? null;
}

/**
 * Delete a review request DM record after the review is submitted.
 */
export async function deleteReviewRequestDm({
  pullRequestId,
  reviewerGithubUsername,
}: {
  pullRequestId: number;
  reviewerGithubUsername: string;
}): Promise<void> {
  await db
    .delete(reviewRequestDms)
    .where(
      and(
        eq(reviewRequestDms.pullRequestId, pullRequestId),
        eq(reviewRequestDms.reviewerGithubUsername, reviewerGithubUsername),
      ),
    );
}
