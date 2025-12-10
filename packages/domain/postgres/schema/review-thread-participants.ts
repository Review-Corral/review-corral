import { bigint, index, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";

/**
 * Tracks participants in inline review comment threads.
 * Each thread is identified by its root comment ID (the first comment in the thread).
 */
export const reviewThreadParticipants = pgTable(
  "review_thread_participants",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    // The root comment ID of the thread (first comment, or in_reply_to_id for replies)
    threadId: bigint("thread_id", { mode: "number" }).notNull(),
    githubUsername: text("github_username").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    threadIdx: index("idx_review_thread_participants_thread").on(table.threadId),
    threadUserUnique: unique("review_thread_participants_thread_user_unique").on(
      table.threadId,
      table.githubUsername,
    ),
  }),
);

export type ReviewThreadParticipant = typeof reviewThreadParticipants.$inferSelect;
export type NewReviewThreadParticipant = typeof reviewThreadParticipants.$inferInsert;
