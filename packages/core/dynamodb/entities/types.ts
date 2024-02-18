import { CreateEntityItem, EntityItem, UpdateEntityItem } from "electrodb";
import { MemberEntity } from "./member";
import { OrganizationEntity } from "./organization";
import { PullRequestEntity } from "./pullRequest";
import { RepositoryEntity } from "./repository";
import { UserEntity } from "./user";

export type Organization = EntityItem<typeof OrganizationEntity>;
export type User = EntityItem<typeof UserEntity>;
export type Member = EntityItem<typeof MemberEntity>;
export type PullRequest = EntityItem<typeof PullRequestEntity>;
export type Repository = EntityItem<typeof RepositoryEntity>;

export type OrganizationInsertArgs = CreateEntityItem<
  typeof OrganizationEntity
>;

export type PullRequestInsertArgs = CreateEntityItem<typeof PullRequestEntity>;
export type PullRequestUpdateArgs = UpdateEntityItem<typeof PullRequestEntity>;

export type UserInsertArgs = CreateEntityItem<typeof UserEntity>;

export type MemberInsertArgs = CreateEntityItem<typeof MemberEntity>;
