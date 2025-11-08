import {
  Subscription,
  SubscriptionInsertArgs,
  SubscriptionUpdateArgs,
} from "@core/dynamodb/entities/types";
import { Db } from "../client";

interface SubscriptionKeys {
  customerId: string;
  subId: string;
}

export const fetchSubscriptionsByOrgId = async (
  orgId: number,
  options: { includeDeleted?: boolean } = {},
): Promise<Subscription[]> => {
  const subscriptions = await Db.entities.subscription.query
    .byOrg({ orgId })
    .go()
    .then(({ data }) => data);

  // Filter out soft-deleted subscriptions unless explicitly requested
  if (options.includeDeleted) {
    return subscriptions;
  }
  return subscriptions.filter((sub) => !sub.deletedAt);
};

export const fetchSubscriptionsByCustomerId = async (
  customerId: string,
  options: { includeDeleted?: boolean } = {},
): Promise<Subscription[]> => {
  const subscriptions = await Db.entities.subscription.query
    .primary({ customerId })
    .go()
    .then(({ data }) => data);

  // Filter out soft-deleted subscriptions unless explicitly requested
  if (options.includeDeleted) {
    return subscriptions;
  }
  return subscriptions.filter((sub) => !sub.deletedAt);
};

export const fetchSubscription = async ({
  customerId,
  subId,
}: SubscriptionKeys): Promise<Subscription | null> => {
  return await Db.entities.subscription
    .get({ customerId, subId })
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

export const updateSubscription = async ({
  subId,
  customerId,
  ...stripeArgs
}: SubscriptionKeys & SubscriptionUpdateArgs) => {
  return await Db.entities.subscription
    .patch({ subId, customerId })
    .set(stripeArgs)
    .go({ response: "all_new" });
};

export const upsertSubscription = async (args: SubscriptionInsertArgs) => {
  await Db.entities.subscription.upsert(args).go();
};
