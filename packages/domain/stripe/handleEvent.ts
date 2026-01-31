import { stripeCheckoutCreatedMetadataSchema } from "@core/stripe/types";
import { Logger } from "@domain/logging";
import { getOrganization } from "@domain/postgres/fetchers/organizations";
import {
  updateSubscriptionStatus,
  upsertSubscription,
} from "@domain/postgres/fetchers/subscriptions";
import Stripe from "stripe";
import { StripeClient } from "./Stripe";

const LOGGER = new Logger("stripe.handleEvent");

/**
 * Handles customer.subscription.updated webhook event. This handles status changes
 * (active, past_due, canceled, etc.) for existing subscriptions.
 *
 * Note: Stripe does NOT copy checkout session metadata to subscription metadata,
 * so this handler usually won't have orgId. The subscription should already exist
 * from handleSessionCompleted(). If it doesn't exist yet, we log and wait for that
 * handler to create it.
 */
export const handleSubUpdated = async (
  event: Stripe.CustomerSubscriptionUpdatedEvent,
) => {
  LOGGER.info(`📝 Subscription updated: ${event.id}`, { event }, { depth: 5 });

  const actualEvent = event.data.object;

  if (!actualEvent.status) {
    LOGGER.warn("Recieved subUpdated event without status", { actualEvent: event });
    return;
  }

  const priceId = actualEvent.items.data[0].price?.id;

  if (!priceId) {
    LOGGER.warn("Recieved subUpdated event without priceId", {
      actualEvent: event,
      priceId,
    });
    return;
  }

  if (typeof actualEvent.customer !== "string") {
    LOGGER.error("Recieved subUpdated event where customer is not a string", {
      actualEvent: event,
      typeofCustomer: typeof actualEvent.customer,
    });
    return;
  }

  const parsedMetadata = stripeCheckoutCreatedMetadataSchema.safeParse(
    actualEvent.metadata,
  );

  if (parsedMetadata.success) {
    // Rare case: subscription has orgId in metadata - do full upsert
    const args = {
      orgId: parsedMetadata.data.orgId,
      customerId: actualEvent.customer,
      status: actualEvent.status,
      subscriptionId: actualEvent.id,
      priceId: priceId,
    };

    LOGGER.info("Upserting subscription with orgId from metadata", { args });
    await upsertSubscription(args);
  } else {
    // Common case: no orgId in metadata - try to update existing subscription
    LOGGER.info("Updating subscription status (no orgId in metadata)", {
      customerId: actualEvent.customer,
      subscriptionId: actualEvent.id,
      status: actualEvent.status,
    });

    const updated = await updateSubscriptionStatus({
      customerId: actualEvent.customer,
      subscriptionId: actualEvent.id,
      status: actualEvent.status,
      priceId: priceId,
    });

    if (!updated) {
      // Subscription doesn't exist yet - checkout.session.completed will create it
      LOGGER.info(
        "Subscription not found for update - waiting for checkout.session.completed",
        {
          customerId: actualEvent.customer,
          subscriptionId: actualEvent.id,
        },
      );
    }
  }
};

/**
 * Handles checkout.session.completed webhook event. This is the primary handler for
 * creating subscriptions since it has access to orgId via checkout session metadata.
 * Stripe does NOT copy checkout session metadata to subscription metadata, so we must
 * create the subscription record here.
 */
export const handleSessionCompleted = async (
  event: Stripe.CheckoutSessionCompletedEvent,
) => {
  LOGGER.info(`🚀 Session completed: ${event.id}`, { event }, { depth: 5 });

  const actualEvent = event.data.object;
  const metadata = stripeCheckoutCreatedMetadataSchema.safeParse(actualEvent.metadata);

  if (!metadata.success) {
    LOGGER.error(
      "Invalid metadata for sessionCompleted event",
      {
        parseResult: metadata,
        eventMetadata: actualEvent.metadata,
      },
      { depth: 5 },
    );
    return;
  }

  const org = await getOrganization(metadata.data.orgId);

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

  // Fetch subscription details from Stripe to get status and priceId
  const stripeSubscription = await StripeClient.subscriptions.retrieve(
    actualEvent.subscription,
  );

  const priceId = stripeSubscription.items.data[0]?.price?.id;

  if (!priceId) {
    LOGGER.error("Subscription has no price ID", {
      subscriptionId: actualEvent.subscription,
      stripeSubscription,
    });
    return;
  }

  // Create or update the subscription with full data including orgId
  await upsertSubscription({
    orgId: org.id,
    customerId: actualEvent.customer,
    subscriptionId: actualEvent.subscription,
    status: stripeSubscription.status,
    priceId: priceId,
  });

  LOGGER.info("Created/updated subscription from checkout session", {
    orgId: org.id,
    subscriptionId: actualEvent.subscription,
    status: stripeSubscription.status,
  });
};
