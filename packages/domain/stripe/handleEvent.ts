import {
  insertSubscription,
  updateSubscription,
} from "@domain/dynamodb/fetchers/subscription";
import { Logger } from "@domain/logging";
import Stripe from "stripe";

const LOGGER = new Logger("stripe.handleEvent");

export const handleSubCreated = async (
  event: Stripe.CustomerSubscriptionCreatedEvent,
) => {
  LOGGER.info(`🚀 Subscription created: ${event.id}`, { event });

  // const metadata = stripeCheckoutCreatedMetadataSchema.safeParse(event.metadata);

  // if (!metadata.success) {
  //   LOGGER.error("Invalid metadata for subCreated event ", { metadata });
  //   return;
  // }

  // const org = await fetchOrganizationByAccountId(metadata.data.orgId);

  // if (!org) {
  //   LOGGER.error("Organization not found for subCreated event", { metadata });
  //   return;
  // }

  const actualEvent = event.data.object;
  const items = actualEvent.items;

  if (!items) {
    LOGGER.warn("Recieved subCreated event without line_items", { actualEvent: event });
    return;
  }

  if (items.data.length !== 1) {
    LOGGER.warn("Unexpected number of items for subCreated event ", {
      items,
    });
    return;
  }

  if (!actualEvent.status) {
    LOGGER.warn("Recieved subCreated event without status", { actualEvent: event });
    return;
  }

  const priceId = items.data[0].price?.id;

  if (!priceId) {
    LOGGER.warn("Recieved subCreated event without priceId", {
      actualEvent: event,
      priceId,
    });
    return;
  }

  if (typeof actualEvent.customer !== "string") {
    LOGGER.error("Recieved subCreated event where customer is not a string", {
      actualEvent: event,
      typeofCustomer: typeof actualEvent.customer,
    });
    return;
  }

  const args = {
    customerId: actualEvent.customer.toString(),
    status: actualEvent.status,
    subId: actualEvent.id,
    priceId: priceId,
  };

  await insertSubscription(args);

  LOGGER.info(`Subscription created`, args);
};

export const handleSubUpdated = async (
  event: Stripe.CustomerSubscriptionUpdatedEvent,
) => {
  LOGGER.info(`🚀 Subscription updated: ${event.id}`, { event });

  const actualEvent = event.data.object;

  if (!actualEvent.status) {
    LOGGER.warn("Recieved subUpdated event without status", { actualEvent: event });
    return;
  }

  if (typeof actualEvent.customer !== "string") {
    LOGGER.error("Recieved subUpdated event where customer is not a string", {
      actualEvent: event,
      typeofCustomer: typeof actualEvent.customer,
    });
    return;
  }

  const args = {
    status: actualEvent.status,
    subId: actualEvent.id,
    customerId: actualEvent.customer,
  };

  await updateSubscription(args);

  LOGGER.info(`Subscription updated`, args);
};
