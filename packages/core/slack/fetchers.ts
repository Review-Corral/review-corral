import { eq } from "drizzle-orm";
import { DB } from "../db/db";
import { slackIntegration } from "../db/schema";
import {
  Organization,
  SlackIntegration,
  SlackIntegrationInsertionArgs,
} from "../db/types";

export const getSlackInstallationsForOrganization = async (
  organization: Organization
): Promise<SlackIntegration[]> => {
  return await DB.select()
    .from(slackIntegration)
    .where(eq(slackIntegration.organizationId, organization.id));
};

export const insertSlackIntegration = async (
  args: SlackIntegrationInsertionArgs
) => {
  return await DB.insert(slackIntegration)
    .values(args)
    .returning()
    .onConflictDoUpdate({
      target: [
        slackIntegration.organizationId,
        slackIntegration.slackTeamId,
        slackIntegration.channelId,
      ],
      set: {
        updatedAt: new Date().toISOString(),
        accessToken: args.accessToken,
      },
    });
};
