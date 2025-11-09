import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { slackIntegrations } from "./slack-integrations";

export const slackUsers = pgTable(
  "slack_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slackTeamId: text("slack_team_id").notNull(),
    slackUserId: text("slack_user_id").notNull(),
    realNameNormalized: text("real_name_normalized").notNull(),
    isBot: boolean("is_bot").notNull().default(false),
    isOwner: boolean("is_owner").notNull().default(false),
    isAdmin: boolean("is_admin").notNull().default(false),
    email: text("email"),
    image48: text("image_48"),
    expiresAt: timestamp("expires_at", { withTimezone: true })
      .notNull()
      .$defaultFn(() => new Date(Date.now() + 60000)),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    teamIdx: index("idx_slack_users_team").on(table.slackTeamId),
    expiresIdx: index("idx_slack_users_expires").on(table.expiresAt),
    teamUserUnique: unique("slack_users_team_user_unique").on(
      table.slackTeamId,
      table.slackUserId,
    ),
  }),
);

export const slackUsersRelations = relations(slackUsers, ({ one }) => ({
  slackIntegration: one(slackIntegrations, {
    fields: [slackUsers.slackTeamId],
    references: [slackIntegrations.slackTeamId],
  }),
}));

export type SlackUser = typeof slackUsers.$inferSelect;
export type NewSlackUser = typeof slackUsers.$inferInsert;
