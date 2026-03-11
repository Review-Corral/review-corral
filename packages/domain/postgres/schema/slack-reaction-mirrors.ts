import { index, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { SlackCommentDmTargetType } from "./slack-comment-dm-mappings";

export const slackReactionMirrors = pgTable(
  "slack_reaction_mirrors",
  {
    id: text("id").primaryKey(),
    slackChannelId: text("slack_channel_id").notNull(),
    slackMessageTs: text("slack_message_ts").notNull(),
    reactorSlackUserId: text("reactor_slack_user_id").notNull(),
    emoji: text("emoji").notNull(),
    targetType: text("target_type").$type<SlackCommentDmTargetType>().notNull(),
    owner: text("owner").notNull(),
    repo: text("repo").notNull(),
    githubCommentId: text("github_comment_id").notNull(),
    githubReactionId: text("github_reaction_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    reactionUnique: unique("slack_reaction_mirror_unique").on(
      table.slackChannelId,
      table.slackMessageTs,
      table.reactorSlackUserId,
      table.emoji,
    ),
    targetIdx: index("idx_slack_reaction_mirrors_target").on(
      table.owner,
      table.repo,
      table.githubCommentId,
    ),
  }),
);

export type SlackReactionMirror = typeof slackReactionMirrors.$inferSelect;
export type NewSlackReactionMirror = typeof slackReactionMirrors.$inferInsert;
