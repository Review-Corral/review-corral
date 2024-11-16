import { CreateEntityItem, EntityItem, UpdateEntityItem } from "electrodb";
import { MemberEntity } from "./member";
import { OrganizationEntity } from "./organization";
import { PullRequestEntity } from "./pullRequest";
import { RepositoryEntity } from "./repository";
import { SlackEntity } from "./slack";
import { SlackUserEntity } from "./slackUser";
import { SubscriptionEntity } from "./subscription";
import { UserEntity } from "./user";
import { BranchEntity } from "./branch";

export type Organization = EntityItem<typeof OrganizationEntity>;
export type User = EntityItem<typeof UserEntity>;
export type Member = EntityItem<typeof MemberEntity>;
export type PullRequestItem = EntityItem<typeof PullRequestEntity>;
export type Repository = EntityItem<typeof RepositoryEntity>;
export type SlackIntegration = EntityItem<typeof SlackEntity>;
export type SlackUser = EntityItem<typeof SlackUserEntity>;
export type Subscription = EntityItem<typeof SubscriptionEntity>;
export type Branch = EntityItem<typeof BranchEntity>;

export type OrganizationInsertArgs = CreateEntityItem<typeof OrganizationEntity>;
export type UserInsertArgs = CreateEntityItem<typeof UserEntity>;
export type MemberInsertArgs = CreateEntityItem<typeof MemberEntity>;
export type PullRequestInsertArgs = CreateEntityItem<typeof PullRequestEntity>;
export type SlackIntegrationInsertArgs = CreateEntityItem<typeof SlackEntity>;
export type SlackUserInsertArgs = CreateEntityItem<typeof SlackUserEntity>;
export type RepositoryInsertArgs = CreateEntityItem<typeof RepositoryEntity>;
export type SubscriptionInsertArgs = CreateEntityItem<typeof SubscriptionEntity>;
export type SubscriptionUpdateArgs = UpdateEntityItem<typeof SubscriptionEntity>;

export type PullRequestUpdateArgs = UpdateEntityItem<typeof PullRequestEntity>;
export type OrganizationUpdateArgs = UpdateEntityItem<typeof OrganizationEntity>;
