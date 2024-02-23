import { Db } from "../client";
import {
  SlackIntegration,
  SlackIntegrationInsertArgs,
} from "../entities/types";

export const getSlackInstallationsForOrganization = async (
  organizationId: number
): Promise<SlackIntegration[]> => {
  return await Db.entities.slack.query
    .primary({
      orgId: organizationId,
    })
    .go()
    .then(({ data }) => data);
};

export const insertSlackIntegration = async (
  args: SlackIntegrationInsertArgs
) => {
  await Db.entities.slack
    .create(args)
    .go()
    .then(({ data }) => data);
};
