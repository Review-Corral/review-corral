import { stripeCheckoutCreatedMetadataSchema } from "@core/stripe/types";
import {
  fetchOrganizationByAccountId,
  updateOrgStripeSubscription,
} from "@domain/dynamodb/fetchers/organizations";
import { Logger } from "@domain/logging";
import Stripe from "stripe";

const LOGGER = new Logger("stripe.handleEvent");

export const handleSubCreated = async (
  rootEvent: Stripe.CheckoutSessionCompletedEvent,
) => {
  LOGGER.info(`🚀 Subscription created: ${rootEvent.id}`, { event: rootEvent });

  const event = rootEvent.data.object;
  const metadata = stripeCheckoutCreatedMetadataSchema.safeParse(event.metadata);

  if (!metadata.success) {
    LOGGER.error("Invalid metadata for subCreated event ", { metadata });
    return;
  }

  const org = await fetchOrganizationByAccountId(metadata.data.orgId);

  if (!org) {
    LOGGER.error("Organization not found for subCreated event", { metadata });
    return;
  }

  const items = event.line_items;

  if (!items) {
    LOGGER.warn("Recieved subCreated event without line_items", { actualEvent: event });
    return;
  }

  if (items.data.length !== 1) {
    LOGGER.warn("Unexpected number of items for subCreated event ", {
      items: rootEvent.data,
    });
    return;
  }

  if (!event.status) {
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

  const args = {
    orgId: org.orgId,
    customerId: org.customerId,
    status: event.status,
    subId: event.id,
    priceId: priceId,
  };

  await updateOrgStripeSubscription(args);

  LOGGER.info(`Subscription created`, args);
};
