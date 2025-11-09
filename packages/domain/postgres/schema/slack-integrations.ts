import { relations } from "drizzle-orm";
import {
  bigint,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { slackUsers } from "./slack-users";

export const slackIntegrations = pgTable(
  "slack_integrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: bigint("org_id", { mode: "number" })
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    slackTeamId: text("slack_team_id").notNull(),
    slackTeamName: text("slack_team_name"),
    accessToken: text("access_token"),
    channelId: text("channel_id"),
    channelName: text("channel_name"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    orgIdx: index("idx_slack_integrations_org").on(table.orgId),
    teamIdx: index("idx_slack_integrations_team").on(table.slackTeamId),
    orgTeamChannelUnique: unique("slack_integrations_org_team_channel_unique").on(
      table.orgId,
      table.slackTeamId,
      table.channelId,
    ),
  }),
);

export const slackIntegrationsRelations = relations(
  slackIntegrations,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [slackIntegrations.orgId],
      references: [organizations.id],
    }),
    slackUsers: many(slackUsers),
  }),
);

export type SlackIntegration = typeof slackIntegrations.$inferSelect;
export type NewSlackIntegration = typeof slackIntegrations.$inferInsert;
