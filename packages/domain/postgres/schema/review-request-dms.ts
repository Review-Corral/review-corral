import { relations } from "drizzle-orm";
import { bigint, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

/**
 * Tracks review request DM messages sent to reviewers.
 * Used to update the DM when the reviewer submits their review.
 */
export const reviewRequestDms = pgTable(
  "review_request_dms",
  {
    // Slack message identifiers (together uniquely identify a message)
    slackChannelId: text("slack_channel_id").notNull(),
    slackMessageTs: text("slack_message_ts").notNull(),

    // GitHub PR and reviewer info
    pullRequestId: bigint("pull_request_id", { mode: "number" }).notNull(),
    reviewerGithubUsername: text("reviewer_github_username").notNull(),

    // Organization reference
    orgId: bigint("org_id", { mode: "number" })
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // Index for lookup when review is submitted (find latest by PR+reviewer)
    prReviewerIdx: index("idx_review_request_dms_pr_reviewer").on(
      table.pullRequestId,
      table.reviewerGithubUsername,
    ),
    // For cleanup/analytics by org
    orgIdx: index("idx_review_request_dms_org").on(table.orgId),
  }),
);

export const reviewRequestDmsRelations = relations(reviewRequestDms, ({ one }) => ({
  organization: one(organizations, {
    fields: [reviewRequestDms.orgId],
    references: [organizations.id],
  }),
}));

export type ReviewRequestDm = typeof reviewRequestDms.$inferSelect;
export type NewReviewRequestDm = typeof reviewRequestDms.$inferInsert;
