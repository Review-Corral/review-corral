import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { branches } from "./branches";
import { organizations } from "./organizations";
import { pullRequests } from "./pull-requests";

export const repositories = pgTable(
  "repositories",
  {
    id: bigint("id", { mode: "number" }).primaryKey(),
    orgId: bigint("org_id", { mode: "number" })
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    avatarUrl: text("avatar_url"),
    isEnabled: boolean("is_enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    orgIdx: index("idx_repositories_org").on(table.orgId),
    enabledIdx: index("idx_repositories_enabled").on(table.orgId, table.isEnabled),
    orgNameUnique: unique("repositories_org_name_unique").on(
      table.orgId,
      table.name,
    ),
  }),
);

export const repositoriesRelations = relations(repositories, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [repositories.orgId],
    references: [organizations.id],
  }),
  pullRequests: many(pullRequests),
  branches: many(branches),
}));

export type Repository = typeof repositories.$inferSelect;
export type NewRepository = typeof repositories.$inferInsert;
