import { CreateEntityItem, EntityItem, UpdateEntityItem } from "electrodb";
import { OrganizationEntity } from "./organization";
import { PullRequestEntity } from "./pullRequest";
import { RepositoryEntity } from "./repository";
import { UserEntity } from "./user";

export type Organization = EntityItem<typeof OrganizationEntity>;
export type User = EntityItem<typeof UserEntity>;
export type PullRequest = EntityItem<typeof PullRequestEntity>;
export type Repository = EntityItem<typeof RepositoryEntity>;

export type PullRequestInsertArgs = CreateEntityItem<typeof PullRequestEntity>;
export type PullRequestUpdateArgs = UpdateEntityItem<typeof PullRequestEntity>;
