import { relations } from "drizzle-orm";
import { bigint, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organizationMembers } from "./organization-members";

export const users = pgTable(
  "users",
  {
    id: bigint("id", { mode: "number" }).primaryKey(),
    name: text("name"),
    email: text("email"),
    avatarUrl: text("avatar_url"),
    ghAccessToken: text("gh_access_token"),
    status: text("status"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    emailIdx: index("idx_users_email").on(table.email),
  }),
);

export const usersRelations = relations(users, ({ many }) => ({
  organizationMembers: many(organizationMembers),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
