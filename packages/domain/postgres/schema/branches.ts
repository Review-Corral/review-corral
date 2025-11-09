import { relations } from "drizzle-orm";
import {
  bigint,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { repositories } from "./repositories";

export const branches = pgTable(
  "branches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    repoId: bigint("repo_id", { mode: "number" })
      .notNull()
      .references(() => repositories.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    requiredApprovals: integer("required_approvals").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    repoIdx: index("idx_branches_repo").on(table.repoId),
    repoNameUnique: unique("branches_repo_name_unique").on(table.repoId, table.name),
  }),
);

export const branchesRelations = relations(branches, ({ one }) => ({
  repository: one(repositories, {
    fields: [branches.repoId],
    references: [repositories.id],
  }),
}));

export type Branch = typeof branches.$inferSelect;
export type NewBranch = typeof branches.$inferInsert;
