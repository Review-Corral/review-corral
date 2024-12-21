import { fetchOrganizationById } from "@domain/dynamodb/fetchers/organizations";
import { Logger } from "@domain/logging";
import { getBillingDetails } from "@domain/selectors/organization/getBillingDetails";
import ApiHandler from "src/handler";
import { useUser } from "src/utils/useUser";
import * as z from "zod";

const LOGGER = new Logger("organization:getOrgBillingDetails");

const getOrgBillingDetailsParamsSchema = z.object({
  organizationId: z.string(),
});

export const handler = ApiHandler(async (event, _context) => {
  const { organizationId } = getOrgBillingDetailsParamsSchema.parse(
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

  return {
    statusCode: 200,
    body: JSON.stringify(await getBillingDetails(organization)),
  };
});
