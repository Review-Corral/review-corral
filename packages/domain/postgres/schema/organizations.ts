import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organizationMembers } from "./organization-members";
import { repositories } from "./repositories";
import { slackIntegrations } from "./slack-integrations";
import { subscriptions } from "./subscriptions";

export const organizations = pgTable(
  "organizations",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    avatarUrl: text("avatar_url"),
    billingEmail: text("billing_email"),
    installationId: text("installation_id").unique(),
    type: text("type"),
    stripeCustomerId: text("stripe_customer_id").unique(),
    stripeSubscriptionStatus: text("stripe_subscription_status"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    installationIdx: index("idx_organizations_installation").on(
      table.installationId,
    ),
    customerIdx: index("idx_organizations_customer").on(
      table.stripeCustomerId,
    ),
  }),
);

export const organizationsRelations = relations(
  organizations,
  ({ many, one }) => ({
    members: many(organizationMembers),
    repositories: many(repositories),
    slackIntegrations: many(slackIntegrations),
    subscription: one(subscriptions),
  }),
);

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
