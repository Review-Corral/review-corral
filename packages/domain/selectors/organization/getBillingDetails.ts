import { Organization } from "@core/dynamodb/entities/types";
import { BillingDetailsResponse } from "@core/selectorTypes/organization";
import { fetchSubscriptionsByCustomerId } from "@domain/dynamodb/fetchers/subscription";

export const getBillingDetails = async (
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
