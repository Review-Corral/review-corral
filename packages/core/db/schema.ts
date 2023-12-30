import {
  bigint,
  boolean,
  integer,
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

export const githubIntegration = pgTable(
  "github_integration",
  {
    id: text("id").primaryKey().notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    teamId: text("team_id").notNull(),
    accessToken: text("access_token").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }),
  },
  (table) => {
    return {
      githubIntegrationTeamIdKey: unique("github_integration_team_id_key").on(
        table.teamId
      ),
    };
  }
);

export const pullRequests = pgTable(
  "pull_requests",
  {
    id: text("id").primaryKey().notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    threadTs: text("thread_ts"),
    prId: text("pr_id").notNull(),
    organizationId: text("organization_id").references(() => organizations.id),
    draft: boolean("draft").default(false).notNull(),
  },
  (table) => {
    return {
      pullRequestsThreadTsKey: unique("pull_requests_thread_ts_key").on(
        table.threadTs
      ),
      uniquePrId: unique("unique_pr_id").on(table.prId),
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
  organizationId: text("organization_id")
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
    organizationId: text("organization_id").references(() => organizations.id),
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
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  orgId: text("org_id")
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
    id: text("id").primaryKey().notNull(),
    accountName: text("account_name").notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    accountId: bigint("account_id", { mode: "number" }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
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
      organizationsAccountIdKey: unique("organizations_account_id_key").on(
        table.accountId
      ),
      organizationsInstallationIdKey: unique(
        "organizations_installation_id_key"
      ).on(table.installationId),
    };
  }
);

export const githubRepositories = pgTable(
  "github_repositories",
  {
    id: text("id").primaryKey().notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    repositoryId: bigint("repository_id", { mode: "number" }).notNull(),
    repositoryName: text("repository_name").notNull(),
    installationId: integer("installation_id").notNull(),
    isActive: boolean("is_active").default(false).notNull(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id),
  },
  (table) => {
    return {
      githubRepositoriesRepositoryIdKey: unique(
        "github_repositories_repository_id_key"
      ).on(table.repositoryId),
    };
  }
);
