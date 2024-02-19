/**
 * This script moves the data from Postgres to DynamoDB
 */

import { DB as PgDb } from "../../core/db/db";
import {
  organizations,
  pullRequests,
  repositories as repositoriesTable,
} from "../../core/db/schema";
import { Db as DynamoDb } from "../../core/dynamodb";
import {
  OrganizationInsertArgs,
  RepositoryInsertArgs,
} from "../../core/dynamodb/entities/types";

const moveOrganizations = async () => {
  const orgs = await PgDb.select().from(organizations).execute();

  // const usernameMappings = await PgDb.select()
  //   .from(usernameMappingsTable)
  //   .execute();

  const repositories = await PgDb.select().from(repositoriesTable).execute();

  const prs = await PgDb.select().from(pullRequests).execute();

  const newOrgs = orgs.map<OrganizationInsertArgs>((org) => ({
    orgId: org.id,
    name: org.accountName,
    avatarUrl: org.avatarUrl,
    installationId: org.installationId,
    type: org.organizationType === null ? "Organization" : org.organizationType,
    createdAt: org.createdAt ?? undefined,
    updatedAt: org.updatedAt ?? undefined,
  }));

  const newRepos = repositories.map<RepositoryInsertArgs>((repo) => ({
    orgId: repo.organizationId,
    repoId: repo.id,
    name: repo.name,
    createdAt: repo.createdAt ?? undefined,
    updatedAt: repo.updatedAt ?? undefined,
  }));

  await DynamoDb.entities.organization.put(newOrgs).go();
  await DynamoDb.entities.repository.put(newRepos).go();
};
