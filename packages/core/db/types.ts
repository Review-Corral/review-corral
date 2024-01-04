import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { organizations, repositories, slackIntegration, users } from "./schema";

export type User = InferSelectModel<typeof users>;

export type Organization = InferSelectModel<typeof organizations>;
export type OrganizationInsertArgs = InferInsertModel<typeof organizations>;

export type Repository = InferInsertModel<typeof repositories>;
export type RepositoryInsertArgs = InferInsertModel<typeof repositories>;

export type SlackIntegration = InferSelectModel<typeof slackIntegration>;
export type SlackIntegrationInsertionArgs = InferInsertModel<
  typeof slackIntegration
>;
