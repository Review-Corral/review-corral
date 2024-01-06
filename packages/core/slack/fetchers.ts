import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
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
  args: Omit<SlackIntegrationInsertionArgs, "id">
) => {
  return await DB.insert(slackIntegration)
    .values({ id: nanoid(), ...args })
    .returning();
};
