export * as Dynamo from "./dynamo";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { EntityConfiguration, Service } from "electrodb";
import { Table } from "sst/node/table";
import { OrganizationEntity } from "./entities/orgnization";
import { PullRequestEntity } from "./entities/pullRequest";
import { UserEntity } from "./entities/user";

export const Client = new DynamoDBClient({});

export const Configuration: EntityConfiguration = {
  table: Table.db.tableName,
  client: Client,
};

export const Db = new Service({
  organization: OrganizationEntity,
  pullRequest: PullRequestEntity,
  user: UserEntity,
});
