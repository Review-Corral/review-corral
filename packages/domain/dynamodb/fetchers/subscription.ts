import { Subscription, SubscriptionInsertArgs } from "@core/dynamodb/entities/types";
import { Db } from "../client";

interface SubscriptionKeys {
  customerId: string;
  subId: string;
}

export const fetchSubscription = async ({
  customerId,
  subId,
}: SubscriptionKeys): Promise<Subscription[]> => {
  return await Db.entities.subscription.query
    .primary({ customerId, subId })
    .go()
    .then(({ data }) => data);
};

export const insertSubscription = async (
  args: SubscriptionInsertArgs,
): Promise<Subscription> => {
  return await Db.entities.subscription
    .create(args)
    .go()
    .then(({ data }) => data);
};

/**
 * Updates the Stripe billing attributes for an organization
 */
type UpdateSubscriptionArgs =
  | {
      priceId: string;
      status: string;
    }
  | {
      status: string;
    };

export const updateSubscription = async ({
  subId,
  customerId,
  ...stripeArgs
}: SubscriptionKeys & UpdateSubscriptionArgs) => {
  return await Db.entities.subscription
    .patch({ subId, customerId })
    .set(stripeArgs)
    .go();
};
