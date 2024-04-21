import { fetchOrganizationById } from "@core/dynamodb/fetchers/organizations";
import {
  getSlackInstallationUsers,
  getSlackInstallationsForOrganization,
} from "@core/dynamodb/fetchers/slack";
import { Logger } from "@domain/logging";
import { useUser } from "src/utils/useUser";
import { ApiHandler } from "sst/node/api";
import * as z from "zod";

const LOGGER = new Logger("slack:getUsers");

const schema = z.object({
  organizationId: z.string().transform(Number),
});

export const handler = ApiHandler(async (event, context) => {
  const { user, error } = await useUser();

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

  const users = await getSlackInstallationUsers(slackIntegration[0]);

  return {
    statusCode: 200,
    body: JSON.stringify(users),
  };
});
