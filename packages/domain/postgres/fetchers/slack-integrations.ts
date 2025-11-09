import type { SlackApiThrottleInsertArgs } from "@core/dynamodb/entities/types";
import { and, eq } from "drizzle-orm";
import { Db } from "../../dynamodb/client";
import { Logger } from "../../logging";
import { SlackClient } from "../../slack/SlackClient";
import { type SlackIntegrationUsers } from "../../slack/types";
import { db } from "../client";
import {
  type NewSlackIntegration,
  type NewSlackUser,
  type SlackIntegration,
  type SlackUser,
  slackIntegrations,
  slackUsers,
} from "../schema";

const LOGGER = new Logger("fetchers.slack");
const THROTTLE_MINUTES = 5;
const USERS_REQUEST_TYPE = "users_list";

/**
 * Get all slack integrations for an organization
 */
export async function getSlackInstallationsForOrganization(
  organizationId: number,
): Promise<SlackIntegration[]> {
  return await db
    .select()
    .from(slackIntegrations)
    .where(eq(slackIntegrations.orgId, organizationId));
}

/**
 * Create a new slack integration
 */
export async function insertSlackIntegration(
  data: NewSlackIntegration,
): Promise<SlackIntegration> {
  const result = await db.insert(slackIntegrations).values(data).returning();
  return result[0];
}

/**
 * Delete a slack integration
 */
export async function deleteSlackIntegration({
  orgId,
  slackTeamId,
  channelId,
}: {
  orgId: number;
  slackTeamId: string;
  channelId: string | null;
}): Promise<void> {
  await db
    .delete(slackIntegrations)
    .where(
      and(
        eq(slackIntegrations.orgId, orgId),
        eq(slackIntegrations.slackTeamId, slackTeamId),
        channelId !== null ? eq(slackIntegrations.channelId, channelId) : undefined,
      ),
    );
}

/**
 * Get all slack users for a slack team
 */
export async function fetchSlackUsers(slackTeamId: string): Promise<SlackUser[]> {
  return await db
    .select()
    .from(slackUsers)
    .where(eq(slackUsers.slackTeamId, slackTeamId));
}

/**
 * Insert slack users (batch)
 */
export async function insertSlackUsers(users: NewSlackUser[]): Promise<void> {
  if (users.length === 0) return;
  await db.insert(slackUsers).values(users);
}

/**
 * Delete all slack users for a team (used before refresh)
 */
export async function deleteSlackUsersForTeam(slackTeamId: string): Promise<void> {
  await db.delete(slackUsers).where(eq(slackUsers.slackTeamId, slackTeamId));
}

/**
 * Checks if a Slack API request was made within the throttle period
 * NOTE: Uses DynamoDB for throttling (as requested to keep slack-api-throttles in DynamoDB)
 */
async function isRequestThrottled(
  slackTeamId: string,
  requestType: string,
): Promise<boolean> {
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
    return false;
  }
}

/**
 * Records a Slack API request in the throttle table
 * NOTE: Uses DynamoDB for throttling (as requested to keep slack-api-throttles in DynamoDB)
 */
async function recordApiRequest(
  slackTeamId: string,
  requestType: string,
): Promise<void> {
  try {
    const throttleArgs: SlackApiThrottleInsertArgs = {
      slackTeamId,
      requestType,
    };

    await Db.entities.slackApiThrottle.put(throttleArgs).go();

    LOGGER.debug("Recorded API request", { slackTeamId, requestType });
  } catch (error) {
    LOGGER.error("Error recording API request", { error, slackTeamId, requestType });
  }
}

/**
 * Get slack installation users with throttling and caching
 */
export async function getSlackInstallationUsers(
  slackIntegration: SlackIntegration,
): Promise<SlackUser[]> {
  const shouldThrottle = await isRequestThrottled(
    slackIntegration.slackTeamId,
    USERS_REQUEST_TYPE,
  );

  const dbSlackUsers = await fetchSlackUsers(slackIntegration.slackTeamId);

  if (dbSlackUsers.length > 0 && shouldThrottle) {
    LOGGER.info("Returning cached SlackUsers due to throttling", {
      count: dbSlackUsers.length,
      slackTeamId: slackIntegration.slackTeamId,
      cacheTime: dbSlackUsers[0].updatedAt,
    });
    return dbSlackUsers;
  }

  LOGGER.info("Fetching fresh SlackUsers from API", {
    slackTeamId: slackIntegration.slackTeamId,
    hadCachedUsers: dbSlackUsers.length > 0,
    wasThrottled: shouldThrottle,
  });

  if (!slackIntegration.channelId || !slackIntegration.accessToken) {
    LOGGER.error("Slack integration missing required fields", {
      hasChannelId: !!slackIntegration.channelId,
      hasAccessToken: !!slackIntegration.accessToken,
    });
    throw new Error("Slack integration missing channelId or accessToken");
  }

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

      await recordApiRequest(slackIntegration.slackTeamId, USERS_REQUEST_TYPE);

      const insertedCount = await handleSlackMembersResponse(
        slackIntegration,
        nonBotUsers,
      );

      const updatedDbSlackUsers = await fetchSlackUsers(slackIntegration.slackTeamId);
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
}

async function handleSlackMembersResponse(
  slackIntegration: SlackIntegration,
  members: SlackIntegrationUsers,
): Promise<number> {
  const toInsertUsers: NewSlackUser[] = [];
  const seenIds = new Set<string>();

  try {
    const existingUsers = await fetchSlackUsers(slackIntegration.slackTeamId);
    if (existingUsers.length > 0) {
      LOGGER.info("Removing existing slack users before refresh", {
        count: existingUsers.length,
        teamId: slackIntegration.slackTeamId,
      });

      await deleteSlackUsersForTeam(slackIntegration.slackTeamId);
    }
  } catch (error) {
    LOGGER.error("Error removing existing slack users", { error });
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
      slackUserId: member.id,
      realNameNormalized: member.profile?.real_name_normalized,
      isBot: member.is_bot ?? false,
      isAdmin: member.is_admin ?? false,
      isOwner: member.is_owner ?? false,
      email: member.profile.email ?? null,
      image48: member.profile.image_512 ?? null,
    });

    seenIds.add(member.id);
  }

  await insertSlackUsers(toInsertUsers);

  return toInsertUsers.length;
}
