import { updateMemberSchema } from "@core/fetchTypes/updateOrgMember";
import { updateOrgMember } from "@domain/dynamodb/fetchers/members";
import { fetchOrganizationById } from "@domain/dynamodb/fetchers/organizations";
import { Logger } from "@domain/logging";
import ApiHandler from "src/handler";
import { useUser } from "src/utils/useUser";
import * as z from "zod";

const LOGGER = new Logger("organization:setMembers");

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

  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Invalid request body" }),
    };
  }

  const body = updateMemberSchema.safeParse(JSON.parse(event.body));

  if (!body.success) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Invalid request body" }),
    };
  }

  const newMember = await updateOrgMember(body.data);

  return {
    statusCode: 200,
    body: JSON.stringify(newMember),
  };
});
