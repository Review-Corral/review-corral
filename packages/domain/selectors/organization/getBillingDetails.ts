import { BillingDetailsResponse } from "@core/selectorTypes/organization";
import { fetchSubscriptionsByCustomerId } from "@domain/dynamodb/fetchers/subscription";
import { Logger } from "@domain/logging";
import { Organization } from "@domain/postgres/schema";

const LOGGER = new Logger("organization:getBillingDetails");

export const getBillingDetails = async (
  organization: Organization,
): Promise<BillingDetailsResponse> => {
  LOGGER.info("Querying subscription details for organization", {
    id: organization.id,
    stripeCustomerId: organization.stripeCustomerId,
  });

  if (!organization.stripeCustomerId) {
    return {
      subscriptions: [],
    };
  }

  const subscriptions = await fetchSubscriptionsByCustomerId(
    organization.stripeCustomerId,
  );

  LOGGER.info("Found subscriptions", { subscriptions });

  return {
    subscriptions: subscriptions,
  };
};
