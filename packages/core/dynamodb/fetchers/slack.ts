import { SlackClient } from "../../slack/SlackClient";
import { Db } from "../client";
import { SlackIntegration, SlackIntegrationInsertArgs } from "../entities/types";

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

export type SlackIntegrationUsers = Awaited<
  ReturnType<typeof SlackClient.prototype.client.users.list>
>;

export const getSlackInstallationUsers = async (
  slackIntegration: SlackIntegration,
): Promise<SlackIntegrationUsers> => {
  const slackClient = new SlackClient(
    slackIntegration.channelId,
    slackIntegration.accessToken,
  );

  return await slackClient.client.users.list();
};
