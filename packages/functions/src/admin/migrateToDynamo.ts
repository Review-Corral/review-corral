/**
 * This script moves the data from Postgres to DynamoDB
 */

import { DB as PgDb } from "../../../core/db/db";
import {
  organizations,
  pullRequests,
  repositories as repositoriesTable,
  slackIntegration,
  usernameMappings,
} from "../../../core/db/schema";
import { Organization } from "../../../core/db/types";
import { Db as DynamoDb } from "../../../core/dynamodb/client";
import {
  MemberInsertArgs,
  OrganizationInsertArgs,
  PullRequestInsertArgs,
  RepositoryInsertArgs,
  SlackIntegrationInsertArgs,
} from "../../../core/dynamodb/entities/types";
import {
  OrgMembers,
  RepositoryPullRequestsResponse,
} from "../../../core/github/endpointTypes";
import {
  getInstallationAccessToken,
  getInstallationRepositories,
  getOrgMembers,
  getRepositoryPullRequests,
} from "../../../core/github/fetchers";
import { Logger } from "../../../core/logging";

const LOGGER = new Logger("migrateToDynamo");

const moveOrganizations = async () => {
  LOGGER.info("🎬 Beginning migration from Postgres to DynamoDB ");
  const orgs = await PgDb.select().from(organizations).execute();

  const repositories = await PgDb.select().from(repositoriesTable).execute();

  const oldSlack = await PgDb.select().from(slackIntegration).execute();

  const oldUsernameMappings = await PgDb.select()
    .from(usernameMappings)
    .execute();

  // Limiting by 30 since that's the default page size for GH pull requests
  // which we do below and map together
  const dbPrs = await PgDb.select().from(pullRequests).limit(100).execute();

  const { ghPrs, orgMembers } = await LoadGhPrs(orgs);

  LOGGER.info("Finished Loading all Prs", {
    dbPrs: dbPrs.length,
    ghPrs: ghPrs.size,
  });

  const newSlack = oldSlack.map<SlackIntegrationInsertArgs>(
    (slackIntegration) => ({
      orgId: slackIntegration.organizationId,
      accessToken: slackIntegration.accessToken,
      channelId: slackIntegration.channelId,
      channelName: slackIntegration.channelName,
      slackTeamId: slackIntegration.slackTeamId,
      slackTeamName: slackIntegration.slackTeamName,
      createdAt: slackIntegration.createdAt ?? undefined,
      updatedAt: slackIntegration.updatedAt ?? undefined,
    })
  );

  const newOrgs = orgs.map<OrganizationInsertArgs>((org) => ({
    orgId: org.id,
    name: org.accountName,
    avatarUrl: org.avatarUrl,
    installationId: org.installationId,
    type: org.organizationType === null ? "Organization" : org.organizationType,
    createdAt: org.createdAt ?? undefined,
    updatedAt: org.updatedAt ?? undefined,
  }));

  const newMembers = oldUsernameMappings
    .map<MemberInsertArgs | null>((mapping) => {
      if (mapping.organizationId == null) {
        return null;
      }

      const members = orgMembers.get(mapping.organizationId);

      const foundMember = members?.find(
        (m) => m.login === mapping.githubUsername
      );

      if (!foundMember) {
        return null;
      }

      const newMember: MemberInsertArgs = {
        orgId: mapping.organizationId,
        memberId: foundMember.id,
        avatarUrl: foundMember.avatar_url,
        name: foundMember.login,
        email: foundMember.email ?? undefined,
        slackId: mapping.slackUserId ?? undefined,
        createdAt: mapping.createdAt ?? undefined,
        updatedAt: mapping.updatedAt ?? undefined,
      };

      return newMember;
    })
    .filter((m): m is MemberInsertArgs => m !== null);

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
        createdAt: dbPr.createdAt ?? undefined,
      };

      return prInsert;
    })
    .filter((pr): pr is PullRequestInsertArgs => pr !== null);

  LOGGER.info("About to insert data into DynamoDB", {
    orgs: newOrgs.length,
    repos: newRepos.length,
    prs: newPrs.length,
    slack: newSlack.length,
  });

  await DynamoDb.entities.organization.put(newOrgs).go();
  LOGGER.info("Finished migrating organizations");

  await DynamoDb.entities.member.put(newMembers).go();
  LOGGER.info("Finished migrating members");

  await DynamoDb.entities.repository.put(newRepos).go();
  LOGGER.info("Finished migrating repos");

  await DynamoDb.entities.slack.put(newSlack).go();
  LOGGER.info("Finished migrating slack integrations");

  await DynamoDb.entities.pullRequest.put(newPrs).go();
  LOGGER.info("Finished migrating prs");

  LOGGER.info("🏁 Finished migrating to DynamoDB");
};

const tryGetAccessToken = async (installationId: number) => {
  try {
    return await getInstallationAccessToken(installationId);
  } catch (error) {
    LOGGER.error("Error getting access token", {
      installationId,
      error: error,
    });
    return null;
  }
};

/**
 * Load all the PRs from Github since we need more information than what we currently
 * have in Postgres
 */
async function LoadGhPrs(orgs: Organization[]) {
  const ghPrs = new Map<
    number,
    RepositoryPullRequestsResponse[number] & { repoId: number }
  >();

  // GH members by orgId
  const orgMembers = new Map<number, OrgMembers>();

  LOGGER.info("About to load all PRs for all repos from Github");
  for (const org of orgs) {
    try {
      LOGGER.info("Loading GH PRs for Org", {
        org: org.accountName,
        orgId: org.id,
      });
      const accessToken = await tryGetAccessToken(org.installationId);

      if (!accessToken) {
        continue;
      }

      LOGGER.info(`🔑 Got access token for org ${org.accountName}`, {
        accessToken: accessToken.token,
      });

      LOGGER.info(`🧬 Getting organization members for org ${org.accountName}`);

      const members = await getOrgMembers({
        orgName: org.accountName,
        accessToken: accessToken.token,
      });

      orgMembers.set(org.id, members);

      const { repositories } = await getInstallationRepositories({
        accessToken: accessToken.token,
        installationId: org.installationId,
      });

      LOGGER.info("Loaded Org Repos", {
        org: org.accountName,
        orgId: org.id,
        reposLength: repositories.length,
      });

      for (const repo of repositories) {
        const repoPrs = await getRepositoryPullRequests({
          orgName: org.accountName,
          repoName: repo.name,
          accessToken: accessToken.token,
        });

        LOGGER.info(`Loaded PRs for Org ${org.accountName}`, {
          repo: repo.name,
          repoId: repo.id,
          prCount: repoPrs.length,
        });

        for (const pr of repoPrs) {
          ghPrs.set(pr.id, { ...pr, repoId: repo.id });
        }

        await delay(200);
      }

      LOGGER.info("Finished loading GH PRs for Org", {
        org: org.accountName,
        orgId: org.id,
      });
      await delay(1000);
    } catch (error) {
      LOGGER.error(`Error loading for org ${org.accountName}`, {
        org: org.accountName,
        orgId: org.id,
        error: error,
      });
    }
  }

  return { ghPrs, orgMembers };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const handler = moveOrganizations;
