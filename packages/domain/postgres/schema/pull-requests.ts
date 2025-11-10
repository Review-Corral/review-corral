import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { repositories } from "./repositories";

export const pullRequests = pgTable(
  "pull_requests",
  {
    id: bigint("id", { mode: "number" }).primaryKey(),
    repoId: bigint("repo_id", { mode: "number" })
      .notNull()
      .references(() => repositories.id, { onDelete: "cascade" }),
    prNumber: bigint("pr_number", { mode: "number" }).notNull(),
    threadTs: text("thread_ts"),
    isDraft: boolean("is_draft").notNull().default(false),
    requiredApprovals: integer("required_approvals").notNull().default(0),
    approvalCount: integer("approval_count").notNull().default(0),
    isQueuedToMerge: boolean("is_queued_to_merge").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    repoIdx: index("idx_pull_requests_repo").on(table.repoId),
    threadIdx: index("idx_pull_requests_thread").on(table.threadTs),
    queueIdx: index("idx_pull_requests_queue").on(table.isQueuedToMerge),
    repoPrUnique: unique("pull_requests_repo_pr_unique").on(
      table.repoId,
      table.prNumber,
    ),
  }),
);

export const pullRequestsRelations = relations(pullRequests, ({ one }) => ({
  repository: one(repositories, {
    fields: [pullRequests.repoId],
    references: [repositories.id],
  }),
}));

export type PullRequest = typeof pullRequests.$inferSelect;
export type NewPullRequest = typeof pullRequests.$inferInsert;
