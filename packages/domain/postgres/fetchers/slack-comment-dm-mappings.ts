import { and, eq } from "drizzle-orm";
import { db } from "../client";
import {
  type NewSlackCommentDmMapping,
  type SlackCommentDmMapping,
  slackCommentDmMappings,
} from "../schema";

export async function insertSlackCommentDmMapping(
  data: NewSlackCommentDmMapping,
): Promise<SlackCommentDmMapping | null> {
  const result = await db
    .insert(slackCommentDmMappings)
    .values(data)
    .onConflictDoNothing()
    .returning();

  return result[0] ?? null;
}

export async function findSlackCommentDmMapping({
  slackTeamId,
  slackChannelId,
  slackMessageTs,
}: {
  slackTeamId: string;
  slackChannelId: string;
  slackMessageTs: string;
}): Promise<SlackCommentDmMapping | null> {
  const result = await db
    .select()
    .from(slackCommentDmMappings)
    .where(
      and(
        eq(slackCommentDmMappings.slackTeamId, slackTeamId),
        eq(slackCommentDmMappings.slackChannelId, slackChannelId),
        eq(slackCommentDmMappings.slackMessageTs, slackMessageTs),
      ),
    )
    .limit(1);

  return result[0] ?? null;
}
