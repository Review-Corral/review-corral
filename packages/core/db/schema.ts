import {
  bigint,
  boolean,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const organizationType = pgEnum("organization_type", [
  "User",
  "Organization",
]);

export const pullRequests = pgTable(
  "pull_requests",
  {
    id: bigint("id", { mode: "number" }).primaryKey().notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    threadTs: text("thread_ts"),
    organizationId: bigint("organization_id", { mode: "number" }).references(
      () => organizations.id
    ),
    draft: boolean("draft").default(false).notNull(),
  },
  (table) => {
    return {
      pullRequestsThreadTsKey: unique("pull_requests_thread_ts_key").on(
        table.threadTs
      ),
    };
  }
);

export const slackIntegration = pgTable("slack_integration", {
  id: text("id").primaryKey().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
  accessToken: text("access_token").notNull(),
  channelId: text("channel_id").notNull(),
  channelName: text("channel_name").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
  slackTeamName: text("slack_team_name").notNull(),
  slackTeamId: text("slack_team_id").notNull(),
  organizationId: bigint("organization_id", { mode: "number" })
    .notNull()
    .references(() => organizations.id),
});

export const usernameMappings = pgTable(
  "username_mappings",
  {
    id: text("id").primaryKey().notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    githubUsername: text("github_username").notNull(),
    slackUserId: text("slack_user_id").notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    organizationId: bigint("organization_id", { mode: "number" }).references(
      () => organizations.id
    ),
  },
  (table) => {
    return {
      usernameMappingsSlackUsernameKey: unique(
        "username_mappings_slack_username_key"
      ).on(table.slackUserId),
    };
  }
);

export const usersAndOrganizations = pgTable("users_and_organizations", {
  id: text("id").primaryKey().notNull(),
  userId: bigint("user_id", { mode: "number" })
    .notNull()
    .references(() => users.id),
  orgId: bigint("org_id", { mode: "number" })
    .notNull()
    .references(() => organizations.id),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
});

export const users = pgTable("users", {
  id: bigint("id", { mode: "number" }).primaryKey().notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
  email: text("email").unique(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
  ghAccessToken: text("gh_access_token"),
});

export const organizations = pgTable(
  "organizations",
  {
    /**
     * The account id is used for this
     */
    id: bigint("id", { mode: "number" }).primaryKey().notNull(),
    accountName: text("account_name").notNull(),
    installationId: bigint("installation_id", { mode: "number" }).notNull(),
    avatarUrl: text("avatar_url").notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    organizationType: organizationType("organization_type"),
  },
  (table) => {
    return {
      organizationsInstallationIdKey: unique(
        "organizations_installation_id_key"
      ).on(table.installationId),
    };
  }
);

export const repositories = pgTable("repositories", {
  /**
   * The Github repository ID is used for this
   */
  id: bigint("id", { mode: "number" }).primaryKey().notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
  name: text("name").notNull(),
  organizationId: bigint("organization_id", { mode: "number" })
    .notNull()
    .references(() => organizations.id),
  isActive: boolean("is_active").default(false).notNull(),
});
