import { Organization } from "@core/dynamodb/entities/types";
import { BillingDetailsResponse } from "@core/selectorTypes/organization";
import { fetchSubscriptionsByCustomerId } from "@domain/dynamodb/fetchers/subscription";
import { Logger } from "@domain/logging";

const LOGGER = new Logger("organization:getBillingDetails");

export const getBillingDetails = async (
  organization: Organization,
): Promise<BillingDetailsResponse> => {
  LOGGER.info("Querying subscription details for organization", {
    id: organization.orgId,
    customerId: organization.customerId,
  });

  if (!organization.customerId) {
    return {
      subscriptions: [],
    };
  }

  const subscriptions = await fetchSubscriptionsByCustomerId(organization.customerId);

  LOGGER.info("Found subscriptions", { subscriptions });

  return {
    subscriptions: subscriptions,
  };
};
