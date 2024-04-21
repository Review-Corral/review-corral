import {
  SlackIntegration,
  SlackIntegrationInsertArgs,
} from "@core/dynamodb/entities/types";
import { SlackClient } from "@core/slack/SlackClient";
import { SlackIntegrationUsers } from "@core/slack/types";
import { Db } from "../client";

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

  return await slackClient.client.users.list();
};
