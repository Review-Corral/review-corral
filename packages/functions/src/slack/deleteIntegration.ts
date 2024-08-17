import { Db } from "@domain/dynamodb/client";
import { fetchOrganizationById } from "@domain/dynamodb/fetchers/organizations";
import { Logger } from "@domain/logging";
import { useUser } from "src/utils/useUser";
import { ApiHandler } from "sst/node/api";
import * as z from "zod";

const LOGGER = new Logger("slack:deleteIntegration");

const schema = z.object({
  orgId: z.string().transform(Number),
  slackTeamId: z.string(),
  channelId: z.string(),
});

export const handler = ApiHandler(async (event, _context) => {
  const { user, error } = await useUser();

  LOGGER.info("Got request to delete Slack integration", {
    event,
    user,
  });

  const { orgId, slackTeamId, channelId } = schema.parse(event.pathParameters);

  if (!user) {
    LOGGER.error("No user found in session", { error });
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized" }),
    };
  }

  const organization = await fetchOrganizationById(orgId);

  if (!organization) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: "Organization not found" }),
    };
  }

  await Db.entities.slack
    .delete({
      orgId,
      slackTeamId,
      channelId,
    })
    .go();

  LOGGER.info("Slack integration deleted", {
    orgId,
    slackTeamId,
    channelId,
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Slack integration deleted" }),
  };
});
