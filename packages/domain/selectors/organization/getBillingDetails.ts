import { BillingDetailsResponse } from "@core/selectorTypes/organization";
import { Logger } from "@domain/logging";
import { fetchSubscriptionsByOrgId } from "@domain/postgres/fetchers/subscriptions";
import { Organization } from "@domain/postgres/schema";

const LOGGER = new Logger("organization:getBillingDetails");

export const getBillingDetails = async (
  organization: Organization,
): Promise<BillingDetailsResponse> => {
  LOGGER.info("Querying subscription details for organization", {
    id: organization.id,
  });

  const subscriptions = await fetchSubscriptionsByOrgId(organization.id);

  LOGGER.info("Found subscriptions", { subscriptions });

  return {
    subscriptions: subscriptions,
  };
};
