export * as Dynamo from "./client";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { MemberEntity } from "@core/dynamodb/entities/member";
import { OrganizationEntity } from "@core/dynamodb/entities/organization";
import { PullRequestEntity } from "@core/dynamodb/entities/pullRequest";
import { RepositoryEntity } from "@core/dynamodb/entities/repository";
import { SlackEntity } from "@core/dynamodb/entities/slack";
import { SlackUserEntity } from "@core/dynamodb/entities/slackUser";
import { SubscriptionEntity } from "@core/dynamodb/entities/subscription";
import { UserEntity } from "@core/dynamodb/entities/user";
import { EntityConfiguration, Service } from "electrodb";
import { Table } from "sst/node/table";

export const Client = new DynamoDBClient({});

export const Configuration: EntityConfiguration = {
  table: Table.main.tableName,
  client: Client,
};

export const Db = new Service(
  {
    organization: OrganizationEntity,
    subscription: SubscriptionEntity,
    pullRequest: PullRequestEntity,
    repository: RepositoryEntity,
    member: MemberEntity,
    user: UserEntity,
    slack: SlackEntity,
    slackUsers: SlackUserEntity,
  },
  Configuration,
);
