import { stripeCheckoutCreatedMetadataSchema } from "@core/stripe/types";
import { insertSubscription } from "@domain/dynamodb/fetchers/subscription";
import { Logger } from "@domain/logging";
import Stripe from "stripe";

const LOGGER = new Logger("stripe.handleSubCreated");

export const handleSubCreated = async (event: Stripe.CheckoutSessionCompletedEvent) => {
  LOGGER.info(`🚀 Subscription created: ${event.id}`, { event });

  const actualEvent = event.data.object;
  const metadata = stripeCheckoutCreatedMetadataSchema.safeParse(actualEvent.metadata);

  if (!metadata.success) {
    LOGGER.error("Invalid metadata for subCreated event ", { metadata });
    return;
  }

  actualEvent.line_items;

  if (event.items.data.length !== 1) {
    LOGGER.warn("Unexpected number of items for subCreated event ", {
      items: event.items.data,
    });
    return;
  }

  for (const item of event.items.data) {
    const createdSubscription = await insertSubscription({
      orgId: metadata.data.orgId,
      subId: event.id,
      priceId: item.id,
      status: event.status,
    });

    LOGGER.info(`Subscription created`, {
      subId: createdSubscription.subId,
      orgId: createdSubscription.orgId,
      priceId: createdSubscription.priceId,
      status: createdSubscription.status,
    });
  }
};
