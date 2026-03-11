import { db } from "../client";
import { slackProcessedEvents } from "../schema";

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
