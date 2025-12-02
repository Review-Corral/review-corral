import { relations } from "drizzle-orm";
import { bigint, index, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { pullRequests } from "./pull-requests";

export const prCommentParticipants = pgTable(
  "pr_comment_participants",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    prId: bigint("pr_id", { mode: "number" })
      .notNull()
      .references(() => pullRequests.id, { onDelete: "cascade" }),
    githubUsername: text("github_username").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    prIdx: index("idx_pr_comment_participants_pr").on(table.prId),
    prUserUnique: unique("pr_comment_participants_pr_user_unique").on(
      table.prId,
      table.githubUsername,
    ),
  }),
);

export const prCommentParticipantsRelations = relations(
  prCommentParticipants,
  ({ one }) => ({
    pullRequest: one(pullRequests, {
      fields: [prCommentParticipants.prId],
      references: [pullRequests.id],
    }),
  }),
);

export type PrCommentParticipant = typeof prCommentParticipants.$inferSelect;
export type NewPrCommentParticipant = typeof prCommentParticipants.$inferInsert;
