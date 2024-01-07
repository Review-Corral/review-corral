import { eq } from "drizzle-orm";
import { DB } from "../db/db";
import { slackIntegration } from "../db/schema";
import { SlackIntegration, SlackIntegrationInsertionArgs } from "../db/types";

export const getSlackInstallationsForOrganization = async (
  organizationId: number
): Promise<SlackIntegration[]> => {
  return await DB.select()
    .from(slackIntegration)
    .where(eq(slackIntegration.organizationId, organizationId));
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
