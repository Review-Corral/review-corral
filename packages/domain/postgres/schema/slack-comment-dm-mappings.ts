import { relations } from "drizzle-orm";
import { bigint, index, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export const slackCommentDmTargetType = {
  issueComment: "issue_comment",
  pullRequestReviewComment: "pull_request_review_comment",
} as const;

export type SlackCommentDmTargetType =
  (typeof slackCommentDmTargetType)[keyof typeof slackCommentDmTargetType];

export const slackCommentDmMappings = pgTable(
  "slack_comment_dm_mappings",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    slackChannelId: text("slack_channel_id").notNull(),
    slackMessageTs: text("slack_message_ts").notNull(),
    orgId: bigint("org_id", { mode: "number" })
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    slackTeamId: text("slack_team_id").notNull(),
    targetType: text("target_type").$type<SlackCommentDmTargetType>().notNull(),
    owner: text("owner").notNull(),
    repo: text("repo").notNull(),
    githubCommentId: bigint("github_comment_id", { mode: "number" }).notNull(),
    commentAuthorGithubUsername: text("comment_author_github_username").notNull(),
    commentBody: text("comment_body"),
    prTitle: text("pr_title").notNull(),
    prNumber: bigint("pr_number", { mode: "number" }).notNull(),
    commentUrl: text("comment_url").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    messageUnique: unique("slack_comment_dm_message_unique").on(
      table.slackChannelId,
      table.slackMessageTs,
    ),
    orgIdx: index("idx_slack_comment_dm_mappings_org").on(table.orgId),
    teamIdx: index("idx_slack_comment_dm_mappings_team").on(table.slackTeamId),
  }),
);

export const slackCommentDmMappingsRelations = relations(
  slackCommentDmMappings,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [slackCommentDmMappings.orgId],
      references: [organizations.id],
    }),
  }),
);

export type SlackCommentDmMapping = typeof slackCommentDmMappings.$inferSelect;
export type NewSlackCommentDmMapping = typeof slackCommentDmMappings.$inferInsert;
