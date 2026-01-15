import { relations } from "drizzle-orm";
import { bigint, index, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export type CommentType = "review_comment" | "issue_comment";

export const dmMessageLinks = pgTable(
  "dm_message_links",
  {
    // Slack message identifiers (together uniquely identify a message)
    slackChannelId: text("slack_channel_id").notNull(),
    slackMessageTs: text("slack_message_ts").notNull(),

    // GitHub comment info
    githubCommentId: bigint("github_comment_id", { mode: "number" }).notNull(),
    commentType: text("comment_type").$type<CommentType>().notNull(),

    // Repository info needed for GitHub API calls
    repoOwner: text("repo_owner").notNull(),
    repoName: text("repo_name").notNull(),

    // Organization reference (needed to look up user's GitHub token)
    orgId: bigint("org_id", { mode: "number" })
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // Primary lookup: find by Slack message
    slackMessageIdx: index("idx_dm_message_links_slack").on(
      table.slackChannelId,
      table.slackMessageTs,
    ),
    // Unique constraint on Slack message
    slackMessageUnique: unique("dm_message_links_slack_unique").on(
      table.slackChannelId,
      table.slackMessageTs,
    ),
    // For cleanup/analytics by org
    orgIdx: index("idx_dm_message_links_org").on(table.orgId),
  }),
);

export const dmMessageLinksRelations = relations(dmMessageLinks, ({ one }) => ({
  organization: one(organizations, {
    fields: [dmMessageLinks.orgId],
    references: [organizations.id],
  }),
}));

export type DmMessageLink = typeof dmMessageLinks.$inferSelect;
export type NewDmMessageLink = typeof dmMessageLinks.$inferInsert;
