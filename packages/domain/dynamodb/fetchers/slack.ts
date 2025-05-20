import {
  SlackApiThrottleInsertArgs,
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
const THROTTLE_MINUTES = 5;
const USERS_REQUEST_TYPE = "users_list";

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

/**
 * Checks if a Slack API request was made within the throttle period
 * @param slackTeamId The Slack team ID
 * @param requestType The type of request (e.g., 'users_list')
 * @returns true if a request was made within the throttle period, false otherwise
 */
const isRequestThrottled = async (
  slackTeamId: string,
  requestType: string,
): Promise<boolean> => {
  try {
    const throttleRecord = await Db.entities.slackApiThrottle.query
      .primary({ slackTeamId, requestType })
      .go()
      .then(({ data }) => (data.length > 0 ? data[0] : null));

    if (!throttleRecord) {
      return false;
    }

    const lastRequestTime = new Date(throttleRecord.requestTime);
    const throttleMs = THROTTLE_MINUTES * 60 * 1000;
    const isWithinThrottlePeriod = Date.now() - lastRequestTime.getTime() < throttleMs;

    LOGGER.debug("Checking throttle status", {
      slackTeamId,
      requestType,
      lastRequestTime,
      isWithinThrottlePeriod,
      throttleMs,
      timeSinceLastRequest: Date.now() - lastRequestTime.getTime(),
    });

    return isWithinThrottlePeriod;
  } catch (error) {
    LOGGER.error("Error checking throttle status", { error });
    return false; // In case of error, proceed with the request
  }
};

/**
 * Records a Slack API request in the throttle table
 * @param slackTeamId The Slack team ID
 * @param requestType The type of request (e.g., 'users_list')
 */
const recordApiRequest = async (
  slackTeamId: string,
  requestType: string,
): Promise<void> => {
  try {
    const throttleArgs: SlackApiThrottleInsertArgs = {
      slackTeamId,
      requestType,
    };

    // Use create or update to ensure we replace any existing record
    await Db.entities.slackApiThrottle.put(throttleArgs).go();

    LOGGER.debug("Recorded API request", { slackTeamId, requestType });
  } catch (error) {
    LOGGER.error("Error recording API request", { error, slackTeamId, requestType });
    // Continue anyway as this is not critical
  }
};

// TODO: this should probably be moved somewhere more appropriate
export const getSlackInstallationUsers = async (
  slackIntegration: SlackIntegration,
): Promise<SlackUser[]> => {
  // Check if we should throttle this request
  const shouldThrottle = await isRequestThrottled(
    slackIntegration.slackTeamId,
    USERS_REQUEST_TYPE,
  );

  // Get cached users from DynamoDB
  const dbSlackUsers = await fetchSlackUsers(slackIntegration);

  // If we have cached users and should throttle, return cache
  if (dbSlackUsers.length > 0 && shouldThrottle) {
    LOGGER.info("Returning cached SlackUsers due to throttling", {
      count: dbSlackUsers.length,
      slackTeamId: slackIntegration.slackTeamId,
      cacheTime: dbSlackUsers[0].updatedAt,
    });
    return dbSlackUsers;
  }

  // If we reach here, we either have no cached data or we're not throttled
  LOGGER.info("Fetching fresh SlackUsers from API", {
    slackTeamId: slackIntegration.slackTeamId,
    hadCachedUsers: dbSlackUsers.length > 0,
    wasThrottled: shouldThrottle,
  });

  // Fetch from Slack API
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
      throw new Error("Slack users response OK, but no members returned");
    } else {
      const nonBotUsers = response.members.filter((member) => !member.is_bot);
      LOGGER.info("Slack users fetched & response OK", {
        count: response.members.length,
        nonBotUsersCount: nonBotUsers.length,
      });

      // Record this API request for throttling
      await recordApiRequest(slackIntegration.slackTeamId, USERS_REQUEST_TYPE);

      // Update DynamoDB with fresh data
      const insertedCount = await handleSlackMembersResponse(
        slackIntegration,
        nonBotUsers,
      );

      // Fetch and return the updated data
      const updatedDbSlackUsers = await fetchSlackUsers(slackIntegration);
      LOGGER.info("Returning newly updated SlackUsers from DB", {
        insertedCount,
        fetchedCount: updatedDbSlackUsers.length,
      });
      return updatedDbSlackUsers;
    }
  } else {
    LOGGER.error("Failed to fetch slack users; response not OK", { response });
    throw new Error("Failed to fetch slack users");
  }
};

const handleSlackMembersResponse = async (
  slackIntegration: SlackIntegration,
  members: SlackIntegrationUsers,
): Promise<number> => {
  const toInsertUsers: SlackUserInsertArgs[] = [];
  const seenIds = new Set<string>();

  // First, delete existing users for this team to ensure we have fresh data
  try {
    const existingUsers = await fetchSlackUsers(slackIntegration);
    if (existingUsers.length > 0) {
      LOGGER.info("Removing existing slack users before refresh", {
        count: existingUsers.length,
        teamId: slackIntegration.slackTeamId,
      });

      // Alternative approach: batch delete all users for this team
      // This is a more efficient approach than deleting individually
      await Db.entities.slackUsers.query
        .primary({ slackTeamId: slackIntegration.slackTeamId })
        .go()
        .then(async ({ data }) => {
          // No data to delete
          if (data.length === 0) return;

          // Delete each user
          for (const user of data) {
            await Db.entities.slackUsers
              .delete({
                slackTeamId: user.slackTeamId,
                updatedAt: user.updatedAt,
                slackUserId: user.slackUserId,
              })
              .go();
          }
        });
    }
  } catch (error) {
    LOGGER.error("Error removing existing slack users", { error });
    // Continue anyway to insert new users
  }

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
