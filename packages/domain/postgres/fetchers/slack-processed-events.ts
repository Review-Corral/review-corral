import { eq } from "drizzle-orm";
import { db } from "../client";
import { slackProcessedEvents } from "../schema";

export async function hasSlackEventBeenProcessed(
  slackEventId: string,
): Promise<boolean> {
  const result = await db
    .select({ slackEventId: slackProcessedEvents.slackEventId })
    .from(slackProcessedEvents)
    .where(eq(slackProcessedEvents.slackEventId, slackEventId))
    .limit(1);

  return result.length > 0;
}

export async function markSlackEventProcessed({
  slackEventId,
  eventType,
}: {
  slackEventId: string;
  eventType: string;
}): Promise<boolean> {
  const result = await db
    .insert(slackProcessedEvents)
    .values({
      slackEventId,
      eventType,
    })
    .onConflictDoNothing()
    .returning();

  return result.length > 0;
}
