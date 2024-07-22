import {
  SlackIntegration,
  SlackIntegrationInsertArgs,
  SlackUser,
  SlackUserInsertArgs,
} from "@core/dynamodb/entities/types";
import { Logger } from "@domain/logging";
import { SlackClient } from "@domain/slack/SlackClient";
import { SlackIntegrationUsers } from "@domain/slack/types";
import { Db } from "../client";

const LOGGER = new Logger("fetchers.slack");

export const getSlackInstallationsForOrganization = async (
  organizationId: number,
): Promise<SlackIntegration[]> => {
  return await Db.entities.slack.query
    .primary({
      orgId: organizationId,
    })
    .go()
    .then(({ data }) => data);
};

export const insertSlackIntegration = async (args: SlackIntegrationInsertArgs) => {
  await Db.entities.slack
    .create(args)
    .go()
    .then(({ data }) => data);
};

export const fetchSlackUsers = async (
  slackIntegration: SlackIntegration,
): Promise<SlackUser[]> => {
  return await Db.entities.slackUsers.query
    .primary({ slackTeamId: slackIntegration.slackTeamId })
    .go()
    .then(({ data }) => data);
};

export const insertSlackUsers = async (args: SlackUserInsertArgs[]): Promise<void> => {
  await Db.entities.slackUsers.put(args).go();
};

// TODO: this should probably be moved somewhere more appropriate
export const getSlackInstallationUsers = async (
  slackIntegration: SlackIntegration,
): Promise<SlackUser[]> => {
  // First check the cache from DynamoDb

  const dbSlackUsers = await fetchSlackUsers(slackIntegration);

  if (dbSlackUsers.length > 0) {
    LOGGER.info("Returning SlackUsers as cached from DB", {
      count: dbSlackUsers.length,
      updatedAt: dbSlackUsers[0].updatedAt,
    });
    return dbSlackUsers;
  }

  // If there's no users in the cache, fetch from Slack API
  const slackClient = new SlackClient(
    slackIntegration.channelId,
    slackIntegration.accessToken,
  );

  const response = await slackClient.client.users.list();

  LOGGER.debug(
    "Fetched slack users",
    {
      response,
      channelId: slackClient.channelId,
    },
    {
      depth: 4,
    },
  );

  if (response.ok) {
    if (!response.members) {
      LOGGER.error("Slack users response OK, but no members returned", { response });
    } else {
      const nonBotUsers = response.members.filter((member) => !member.is_bot);
      LOGGER.info("Slack users fetched & response OK", {
        count: response.members.length,
        nonBotUsersCount: nonBotUsers.length,
      });
      const potentialInsertedCount = await handleSlackMembersResponse(
        slackIntegration,
        nonBotUsers,
      );

      // Refetch and return
      const newDbSlackUsers = await fetchSlackUsers(slackIntegration);
      LOGGER.info("Returning newly inserted SlackUsers from DB", {
        insertedCount: potentialInsertedCount,
        fetchedCount: newDbSlackUsers.length,
      });
      return newDbSlackUsers;
    }
  } else {
    LOGGER.error("Failed to fetch slack users; response not OK", { response });
  }

  throw new Error("Failed to fetch slack users");
};

const handleSlackMembersResponse = async (
  slackIntegration: SlackIntegration,
  members: SlackIntegrationUsers,
): Promise<number> => {
  const toInsertUsers: SlackUserInsertArgs[] = [];

  const seenIds = new Set<string>();

  for (const member of members) {
    if (!member.id || !member.profile || !member.profile.real_name_normalized) {
      LOGGER.warn("Skipping slack member with missing data", { member });
      continue;
    }

    if (seenIds.has(member.id)) {
      continue;
    }

    toInsertUsers.push({
      slackTeamId: slackIntegration.slackTeamId,
      orgId: slackIntegration.orgId,
      slackUserId: member.id,
      realNameNormalized: member.profile?.real_name_normalized,
      isBot: member.is_bot,
      isAdmin: member.is_admin,
      isOwner: member.is_owner,
      email: member.profile.email,
      image48: member.profile.image_512,
    });

    seenIds.add(member.id);
  }

  await insertSlackUsers(toInsertUsers);

  return toInsertUsers.length;
};
