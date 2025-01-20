import { fetchOrganizationById } from "@domain/dynamodb/fetchers/organizations";
import {
  getSlackInstallationUsers,
  getSlackInstallationsForOrganization,
} from "@domain/dynamodb/fetchers/slack";
import { Logger } from "@domain/logging";
import { ApiHandler } from "@src/apiHandler";
import { useUser } from "src/utils/useUser";
import * as z from "zod";

const LOGGER = new Logger("slack:getUsers");

const schema = z.object({
  organizationId: z.string().transform(Number),
});

export const handler = ApiHandler(async (event, _context) => {
  const { user, error } = await useUser(event, LOGGER);

  const { organizationId } = schema.parse(event.pathParameters);

  if (!user) {
    LOGGER.error("No user found in session", { error });
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized" }),
    };
  }

  const organization = await fetchOrganizationById(organizationId);

  if (!organization) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: "Organization not found" }),
    };
  }

  const slackIntegration = await getSlackInstallationsForOrganization(organizationId);

  if (slackIntegration.length === 0) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        message: `No Slack installations found for org Id ${organizationId}`,
      }),
    };
  }

  LOGGER.info("Got Slack Integration for organization", {
    organizationId,
    returnedSlackIntegrations: slackIntegration.length,
    slackIntegration: {
      ...slackIntegration[0],
      accessToken: "REDACTED",
    },
  });

  const users = await getSlackInstallationUsers(slackIntegration[0]);

  return {
    statusCode: 200,
    body: JSON.stringify(users),
  };
});
