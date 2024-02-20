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
  PullRequestInsertArgs,
  RepositoryInsertArgs,
} from "../../core/dynamodb/entities/types";
import { RepositoryPullRequestsResponse } from "../../core/github/endpointTypes";
import {
  getInstallationAccessToken,
  getInstallationRepositories,
  getRepositoryPullRequests,
} from "../../core/github/fetchers";
import { Logger } from "../../core/logging";

const LOGGER = new Logger("migrateToDynamo");

const moveOrganizations = async () => {
  LOGGER.debug("Beginning migration from Postgres to DynamoDB");
  const orgs = await PgDb.select().from(organizations).execute();

  const repositories = await PgDb.select().from(repositoriesTable).execute();

  const dbPrs = await PgDb.select().from(pullRequests).execute();

  const ghPrs = await LoadGhPrs(orgs);

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

  const newPrs: PullRequestInsertArgs[] = dbPrs
    .map<PullRequestInsertArgs | null>((dbPr) => {
      const ghPr = ghPrs.get(dbPr.id);
      if (!ghPr) {
        LOGGER.debug("PR not found in GH", {
          prId: dbPr.id,
          orgId: dbPr.organizationId,
        });
        return null;
      }

      const prInsert: PullRequestInsertArgs = {
        prId: dbPr.id,
        repoId: ghPr.repoId,
        isDraft: dbPr.draft,
        threadTs: dbPr.threadTs ?? undefined,
      };

      return prInsert;
    })
    .filter((pr): pr is PullRequestInsertArgs => pr !== null);

  await DynamoDb.entities.organization.put(newOrgs).go();
  await DynamoDb.entities.repository.put(newRepos).go();
  await DynamoDb.entities.pullRequest.put(newPrs).go();
};

/**
 * Load all the PRs from Github since we need more information than what we currently
 * have in Postgres
 */
async function LoadGhPrs(
  orgs: {
    id: number;
    accountName: string;
    installationId: number;
    avatarUrl: string;
    updatedAt: string | null;
    createdAt: string | null;
    organizationType: "User" | "Organization" | null;
  }[]
) {
  const ghPrs = new Map<
    number,
    RepositoryPullRequestsResponse[number] & { repoId: number }
  >();

  LOGGER.debug("About to load all PRs for all repos from Github");
  for (const org of orgs) {
    LOGGER.debug("Loading GH PRs for Org", {
      org: org.accountName,
      orgId: org.id,
    });
    const accessToken = await getInstallationAccessToken(org.installationId);
    const { repositories } = await getInstallationRepositories({
      accessToken: accessToken.token,
      installationId: org.installationId,
    });

    LOGGER.debug("Loaded Org Repos", {
      org: org.accountName,
      orgId: org.id,
      reposLength: repositories.length,
    });

    for (const repo of repositories) {
      const repoPrs = await getRepositoryPullRequests({
        orgId: org.id,
        repoId: repo.id,
        accessToken: accessToken.token,
      });

      LOGGER.debug(`Loaded PRs for Org ${org.accountName}`, {
        repo: repo.name,
        repoId: repo.id,
        prCount: repoPrs.length,
      });

      for (const pr of repoPrs) {
        ghPrs.set(pr.id, { ...pr, repoId: repo.id });
      }

      await delay(200);
    }

    LOGGER.debug("Finished loading GH PRs for Org", {
      org: org.accountName,
      orgId: org.id,
    });
    await delay(1000);
  }

  return ghPrs;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
