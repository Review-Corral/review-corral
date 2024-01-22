import { useUser } from "src/utils/useUser";
import { ApiHandler } from "sst/node/api";
import * as z from "zod";
import { fetchOrganizationById } from "../../../core/db/fetchers/organizations";
import { Logger } from "../../../core/logging";
import { SlackClient } from "../../../core/slack/SlackClient";
import { getSlackInstallationsForOrganization } from "../../../core/slack/fetchers";

const LOGGER = new Logger("slack:installations");

const schema = z.object({
  organizationId: z.string().transform(Number),
});

export const getSlackInstallations = ApiHandler(async (event, context) => {
  const { user, error } = await useUser();

  const { organizationId } = schema.parse(event.pathParameters);

  if (!user) {
    LOGGER.error("No user found in session", { error });
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized" }),
    };
  }

  const organization = await fetchOrganizationById(Number(organizationId));

  if (!organization) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: "Organization not found" }),
    };
  }

  const slackIntegration = await getSlackInstallationsForOrganization(
    organizationId
  );

  return {
    statusCode: 200,
    body: JSON.stringify(slackIntegration),
  };
});

export const getUsers = ApiHandler(async (event, context) => {
  const { user, error } = await useUser();

  const { organizationId } = schema.parse(event.pathParameters);

  if (!user) {
    LOGGER.error("No user found in session", { error });
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized" }),
    };
  }

  const organization = await fetchOrganizationById(Number(organizationId));

  if (!organization) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: "Organization not found" }),
    };
  }

  const slackIntegrations = await getSlackInstallationsForOrganization(
    organizationId
  );

  if (slackIntegrations.length > 1) {
    // At time of writing, only support one Slack installation per organization
    LOGGER.error("Multiple Slack installations found for organization");
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Not implemented" }),
    };
  }

  if (slackIntegrations.length === 0) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: "No Slack integration found for org" }),
    };
  }

  const slackIntegration = slackIntegrations[0];

  const slackClient = new SlackClient(
    slackIntegration.channelId,
    slackIntegration.accessToken
  );

  return {
    statusCode: 200,
    body: JSON.stringify(await slackClient.getUsers()),
  };
});
