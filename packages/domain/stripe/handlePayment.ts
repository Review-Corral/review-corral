import { stripeCheckoutCreatedMetadataSchema } from "@core/stripe/types";
import { insertSubscription } from "@domain/dynamodb/fetchers/subscription";
import { Logger } from "@domain/logging";
import Stripe from "stripe";

const LOGGER = new Logger("stripe.handleSubCreated");

export const handleSubCreated = async (event: Stripe.Subscription) => {
  LOGGER.info(`🚀 Subscription created: ${event.id}`, { event });
  const metadata = stripeCheckoutCreatedMetadataSchema.safeParse(event.metadata);

  if (!metadata.success) {
    LOGGER.error("Invalid metadata for subCreated event ", { metadata });
    return;
  }

  if (event.items.data.length !== 1) {
    LOGGER.warn("Unexpected number of items for subCreated event ", {
      items: event.items.data,
    });
    return;
  }

  for (const item of event.items.data) {
    await insertSubscription({
      orgId: metadata.data.orgId,
      subId: event.id,
      priceId: item.id,
      status: event.status,
    });
  }
};
