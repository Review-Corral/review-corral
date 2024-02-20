export * as Dynamo from "./client";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { EntityConfiguration, Service } from "electrodb";
import { Table } from "sst/node/table";
import { MemberEntity } from "./entities/member";
import { OrganizationEntity } from "./entities/organization";
import { PullRequestEntity } from "./entities/pullRequest";
import { RepositoryEntity } from "./entities/repository";
import { SlackEntity } from "./entities/slack";
import { UserEntity } from "./entities/user";

export const Client = new DynamoDBClient({});

export const Configuration: EntityConfiguration = {
  table: Table.main.tableName,
  client: Client,
};

export const Db = new Service(
  {
    organization: OrganizationEntity,
    pullRequest: PullRequestEntity,
    repository: RepositoryEntity,
    member: MemberEntity,
    user: UserEntity,
    slack: SlackEntity,
  },
  Configuration
);
