import { stripeCheckoutCreatedMetadataSchema } from "@core/stripe/types";
import {
  fetchOrganizationByAccountId,
  updateOrganizationStripeProps,
} from "@domain/dynamodb/fetchers/organizations";
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

  const sub = await updateSubscription(args);

  if (sub.data.orgId) {
    // Update the organization with the new info for quicker access
    LOGGER.info(`Updating org stripe sub status...`);
    await updateOrganizationStripeProps({
      orgId: sub.data.orgId,
      customerId: actualEvent.customer,
      stripeSubStatus: actualEvent.status,
    });
  }

  LOGGER.info(`Subscription updated`, args);
};

/**
 * The metadata sent to the checkout session (annoyingly) wont be attached to
 * the subscription events, so we use this event to set these properties which we can
 * then use later
 */
export const handleSessionCompleted = async (
  event: Stripe.CheckoutSessionCompletedEvent,
) => {
  LOGGER.info(`🚀 Session completed: ${event.id}`, { event });

  const actualEvent = event.data.object;
  const metadata = stripeCheckoutCreatedMetadataSchema.safeParse(actualEvent);

  if (!metadata.success) {
    LOGGER.error("Invalid metadata for sessionCompleted event ", { metadata });
    return;
  }

  const org = await fetchOrganizationByAccountId(metadata.data.orgId);

  if (!org) {
    LOGGER.error("Organization not found for sessionCompleted event", { metadata });
    return;
  }

  if (typeof actualEvent.customer !== "string") {
    LOGGER.error("Recieved session completed event where customer is not a string", {
      actualEvent: event,
      typeofCustomer: typeof actualEvent.customer,
    });
    return;
  }

  if (typeof actualEvent.subscription !== "string") {
    LOGGER.error(
      "Recieved session completed event where subscription is not a string",
      {
        actualEvent: event,
        typeofCustomer: typeof actualEvent.subscription,
      },
    );
    return;
  }

  // Update the subscription with the OrgId for future use
  const newSub = await updateSubscription({
    subId: actualEvent.subscription,
    customerId: actualEvent.customer,
    orgId: org.orgId,
  });

  // Update the organization with the new info for quicker access
  await updateOrganizationStripeProps({
    orgId: org.orgId,
    customerId: actualEvent.customer,
    stripeSubStatus: newSub.data.status,
  });
};
