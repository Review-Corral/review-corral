import {
  SubscriptionEntity,
  SubscriptionInsertArgs,
} from "@core/dynamodb/entities/types";
import { Db } from "../client";

export const fetchOrgSubscriptions = async ({
  orgId,
}: {
  orgId: number;
}): Promise<SubscriptionEntity[]> => {
  return await Db.entities.subscription.query
    .primary({ orgId })
    .go()
    .then(({ data }) => data);
};

export const insertSubscription = async (
  args: SubscriptionInsertArgs,
): Promise<SubscriptionEntity> => {
  return await Db.entities.subscription
    .create(args)
    .go()
    .then(({ data }) => data);
};
