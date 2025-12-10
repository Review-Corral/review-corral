import { eq } from "drizzle-orm";
import { db } from "../client";
import { reviewThreadParticipants } from "../schema";

/**
 * Add a participant to a review comment thread.
 * Uses ON CONFLICT DO NOTHING to handle duplicates gracefully.
 */
export async function addReviewThreadParticipant({
  threadId,
  githubUsername,
}: {
  threadId: number;
  githubUsername: string;
}): Promise<void> {
  await db
    .insert(reviewThreadParticipants)
    .values({ threadId, githubUsername })
    .onConflictDoNothing();
}

/**
 * Get all participants for a review comment thread.
 */
export async function getReviewThreadParticipants({
  threadId,
}: {
  threadId: number;
}): Promise<string[]> {
  const results = await db
    .select({ githubUsername: reviewThreadParticipants.githubUsername })
    .from(reviewThreadParticipants)
    .where(eq(reviewThreadParticipants.threadId, threadId));

  return results.map((r) => r.githubUsername);
}
