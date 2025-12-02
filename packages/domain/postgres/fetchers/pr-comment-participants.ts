import { eq } from "drizzle-orm";
import { db } from "../client";
import { prCommentParticipants } from "../schema";

/**
 * Add a participant to a PR's comment thread.
 * Uses ON CONFLICT DO NOTHING to handle duplicates gracefully.
 */
export async function addPrCommentParticipant({
  prId,
  githubUsername,
}: {
  prId: number;
  githubUsername: string;
}): Promise<void> {
  await db
    .insert(prCommentParticipants)
    .values({ prId, githubUsername })
    .onConflictDoNothing();
}

/**
 * Get all participants for a PR's comment thread.
 */
export async function getPrCommentParticipants({
  prId,
}: {
  prId: number;
}): Promise<string[]> {
  const results = await db
    .select({ githubUsername: prCommentParticipants.githubUsername })
    .from(prCommentParticipants)
    .where(eq(prCommentParticipants.prId, prId));

  return results.map((r) => r.githubUsername);
}
