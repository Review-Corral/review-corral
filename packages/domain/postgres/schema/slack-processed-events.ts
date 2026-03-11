import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const slackProcessedEvents = pgTable("slack_processed_events", {
  slackEventId: text("slack_event_id").primaryKey(),
  eventType: text("event_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SlackProcessedEvent = typeof slackProcessedEvents.$inferSelect;
export type NewSlackProcessedEvent = typeof slackProcessedEvents.$inferInsert;
