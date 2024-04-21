import {
  SlackIntegration,
  SlackIntegrationInsertArgs,
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

export const getSlackInstallationUsers = async (
  slackIntegration: SlackIntegration,
): Promise<SlackIntegrationUsers> => {
  const slackClient = new SlackClient(
    slackIntegration.channelId,
    slackIntegration.accessToken,
  );

  const response = await slackClient.client.users.list();

  if (response.ok) {
    return response.members;
  }

  LOGGER.error("Failed to fetch slack users", { response });

  throw new Error("Failed to fetch slack users");
};
