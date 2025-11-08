import { Organization } from "@core/dynamodb/entities/types";
import { BillingDetailsResponse } from "@core/selectorTypes/organization";
import {
  fetchSubscriptionsByCustomerId,
  fetchSubscriptionsByOrgId,
  updateSubscription,
} from "@domain/dynamodb/fetchers/subscription";
import { Logger } from "@domain/logging";

const LOGGER = new Logger("organization:getBillingDetails");

export const getBillingDetails = async (
  organization: Organization,
): Promise<BillingDetailsResponse> => {
  LOGGER.info("Querying subscription details for organization", {
    id: organization.orgId,
    customerId: organization.customerId,
  });

  let subscriptions = await fetchSubscriptionsByOrgId(organization.orgId);

  // Fallback for existing records that don't have GSI data yet
  if (subscriptions.length === 0 && organization.customerId) {
    LOGGER.info("No subscriptions found by orgId, trying customerId fallback");
    subscriptions = await fetchSubscriptionsByCustomerId(organization.customerId);

    // Update the subscriptions with orgId to populate the GSI for future queries
    if (subscriptions.length > 0) {
      LOGGER.info("Updating subscriptions with orgId to populate GSI", {
        count: subscriptions.length,
      });

      await Promise.all(
        subscriptions.map((sub) =>
          updateSubscription({
            customerId: sub.customerId,
            subId: sub.subId,
            orgId: organization.orgId,
          }),
        ),
      );
    }
  }

  LOGGER.info("Found subscriptions", { subscriptions });

  return {
    subscriptions: subscriptions,
  };
};
