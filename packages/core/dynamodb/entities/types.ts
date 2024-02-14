import { EntityItem } from "electrodb";
import { OrganizationEntity } from "./organization";
import { PullRequestEntity } from "./pullRequest";
import { UserEntity } from "./user";

export type Organization = EntityItem<typeof OrganizationEntity>;
export type User = EntityItem<typeof UserEntity>;
export type PullRequest = EntityItem<typeof PullRequestEntity>;
