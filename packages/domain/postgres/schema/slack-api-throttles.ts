import {
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const slackApiThrottles = pgTable(
  "slack_api_throttles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slackTeamId: text("slack_team_id").notNull(),
    requestType: text("request_type").notNull(),
    requestTime: timestamp("request_time", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true })
      .notNull()
      .$defaultFn(() => new Date(Date.now() + 900000)),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    expiresIdx: index("idx_slack_throttles_expires").on(table.expiresAt),
    teamTypeUnique: unique("slack_throttles_team_type_unique").on(
      table.slackTeamId,
      table.requestType,
    ),
  }),
);

export type SlackApiThrottle = typeof slackApiThrottles.$inferSelect;
export type NewSlackApiThrottle = typeof slackApiThrottles.$inferInsert;
