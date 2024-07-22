import { getOrganizationMembers } from "@domain/dynamodb/fetchers/members";
import { fetchOrganizationById } from "@domain/dynamodb/fetchers/organizations";
import { Logger } from "@domain/logging";
import { useUser } from "src/utils/useUser";
import { ApiHandler } from "sst/node/api";
import * as z from "zod";

const LOGGER = new Logger("organization:getMembers");

const getRepositoriesForOrganizationSchena = z.object({
  organizationId: z.string(),
});

export const handler = ApiHandler(async (event, _context) => {
  const { organizationId } = getRepositoriesForOrganizationSchena.parse(
    event.pathParameters,
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

  const members = await getOrganizationMembers(organization.orgId);

  return {
    statusCode: 200,
    body: JSON.stringify(members),
  };
});
