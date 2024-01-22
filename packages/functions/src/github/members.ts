import { useUser } from "src/utils/useUser";
import { ApiHandler } from "sst/node/api";
import { fetchOrganizationById } from "../../../core/db/fetchers/organizations";
import { getInstallationMembers } from "../../../core/github/fetchers";
import { Logger } from "../../../core/logging";
import { organizationParamSchema } from "./shared";

const LOGGER = new Logger("github:members");

export const getOrganizationMembers = ApiHandler(async (event, context) => {
  const { organizationId } = organizationParamSchema.parse(
    event.pathParameters
  );
  const { user, error } = await useUser();

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

  const members = await getInstallationMembers(organization);

  return {
    statusCode: 200,
    body: JSON.stringify(members),
  };
});
