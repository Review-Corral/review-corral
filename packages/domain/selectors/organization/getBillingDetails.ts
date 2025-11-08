import { Organization } from "@core/dynamodb/entities/types";
import { BillingDetailsResponse } from "@core/selectorTypes/organization";
import { fetchSubscriptionsByOrgId } from "@domain/dynamodb/fetchers/subscription";
import { Logger } from "@domain/logging";

const LOGGER = new Logger("organization:getBillingDetails");

export const getBillingDetails = async (
  organization: Organization,
): Promise<BillingDetailsResponse> => {
  LOGGER.info("Querying subscription details for organization", {
    id: organization.orgId,
    customerId: organization.customerId,
  });

  const subscriptions = await fetchSubscriptionsByOrgId(organization.orgId);

  LOGGER.info("Found subscriptions", { subscriptions });

  return {
    subscriptions: subscriptions,
  };
};
