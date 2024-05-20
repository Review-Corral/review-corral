import { Organization, Subscription } from "@core/dynamodb/entities/types";
import {} from "@domain/dynamodb/fetchers/members";
import { fetchOrganizationById } from "@domain/dynamodb/fetchers/organizations";
import { fetchSubscriptionsByCustomerId } from "@domain/dynamodb/fetchers/subscription";
import {} from "@domain/github/fetchers";
import { Logger } from "@domain/logging";
import { useUser } from "src/utils/useUser";
import { ApiHandler } from "sst/node/api";
import * as z from "zod";

const LOGGER = new Logger("organization:getOrgBillingDetails");

const getOrgBillingDetailsParamsSchema = z.object({
  organizationId: z.string(),
});

interface BillingDetailsResponse {
  subscriptions: Subscription[];
}

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
    body: JSON.stringify(getBillingDetails(organization)),
  };
});

const getBillingDetails = async (
  organization: Organization,
): Promise<BillingDetailsResponse> => {
  if (!organization.customerId) {
    return {
      subscriptions: [],
    };
  }

  return {
    subscriptions: await fetchSubscriptionsByCustomerId(organization.customerId),
  };
};
