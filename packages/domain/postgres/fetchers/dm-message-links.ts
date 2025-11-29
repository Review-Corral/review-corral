import { and, eq } from "drizzle-orm";
import { db } from "../client";
import {
  type DmMessageLink,
  type NewDmMessageLink,
  dmMessageLinks,
} from "../schema";

/**
 * Insert a new DM message link for reaction tracking
 */
export async function insertDmMessageLink(
  data: NewDmMessageLink,
): Promise<DmMessageLink> {
  const result = await db.insert(dmMessageLinks).values(data).returning();
  return result[0];
}

/**
 * Find a DM message link by Slack channel and message timestamp.
 * Used to look up the GitHub comment when a reaction is added.
 */
export async function findDmMessageLink({
  slackChannelId,
  slackMessageTs,
}: {
  slackChannelId: string;
  slackMessageTs: string;
}): Promise<DmMessageLink | null> {
  const result = await db
    .select()
    .from(dmMessageLinks)
    .where(
      and(
        eq(dmMessageLinks.slackChannelId, slackChannelId),
        eq(dmMessageLinks.slackMessageTs, slackMessageTs),
      ),
    )
    .limit(1);

  return result[0] ?? null;
}
