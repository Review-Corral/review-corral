import { useUser } from "src/utils/useUser";
import { ApiHandler } from "sst/node/api";
import * as z from "zod";
import { fetchOrganizationById } from "../../../core/db/fetchers/organizations";
import { Logger } from "../../../core/logging";
import { getSlackInstallationsForOrganization } from "../../../core/slack/fetchers";

const LOGGER = new Logger("slack:installations");

const schema = z.object({
  organizationId: z.string(),
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
    organization
  );

  return {
    statusCode: 200,
    body: JSON.stringify(slackIntegration),
  };
});
