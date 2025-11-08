import {
  StripeCheckoutCreatedMetadata,
  stripeCheckoutCreatedMetadataSchema,
} from "@core/stripe/types";
import {
  fetchOrganizationById,
  updateOrganization,
} from "@domain/dynamodb/fetchers/organizations";
import {
  updateSubscription,
  upsertSubscription,
} from "@domain/dynamodb/fetchers/subscription";
import { Logger } from "@domain/logging";
import Stripe from "stripe";
import { StripeClient } from "./Stripe";

const LOGGER = new Logger("stripe.handleEvent");

/**
 * Handles subscription update and delete events.
 * IMPORTANT: We NEVER delete subscription records from the database.
 * When Stripe deletes a subscription, we mark it with deletedAt timestamp (soft delete).
 * This maintains a complete audit trail of all subscriptions.
 */
const handleSubEvent = async (
  event:
    | Stripe.CustomerSubscriptionUpdatedEvent
    | Stripe.CustomerSubscriptionDeletedEvent,
  eventType: "updated" | "deleted",
) => {
  LOGGER.info(`📝 Subscription ${eventType}: ${event.id}`, { event }, { depth: 5 });

  const actualEvent = event.data.object;

  if (!actualEvent.status) {
    LOGGER.warn(`Received sub${eventType} event without status`, {
      actualEvent: event,
    });
    return;
  }

  const priceId = actualEvent.items.data[0].price?.id;

  if (!priceId) {
    LOGGER.warn(`Received sub${eventType} event without priceId`, {
      actualEvent: event,
      priceId,
    });
    return;
  }

  if (typeof actualEvent.customer !== "string") {
    LOGGER.error(`Received sub${eventType} event where customer is not a string`, {
      actualEvent: event,
      typeofCustomer: typeof actualEvent.customer,
    });
    return;
  }

  const parsedMetadata = stripeCheckoutCreatedMetadataSchema.safeParse(
    actualEvent.metadata,
  );

  const args = {
    customerId: actualEvent.customer.toString(),
    status: actualEvent.status,
    subId: actualEvent.id,
    priceId: priceId,
    cancelAtPeriodEnd: actualEvent.cancel_at_period_end,
    currentPeriodEnd: actualEvent.current_period_end,
    canceledAt: actualEvent.canceled_at ?? undefined,
    ...(eventType === "deleted" ? { deletedAt: new Date().toISOString() } : {}),
    ...(parsedMetadata.success ? { orgId: parsedMetadata.data.orgId } : {}),
  };

  LOGGER.info("Going to upsert subscription with args:", { args }, { depth: 3 });
  await upsertSubscription(args);
  LOGGER.info("Finished upserting subscription", { depth: 3 });

  if (parsedMetadata.success) {
    // Update the organization with the new info for quicker access
    LOGGER.info("Updating org stripe sub status...");
    await updateOrganization({
      orgId: parsedMetadata.data.orgId,
      customerId: actualEvent.customer,
      stripeSubStatus: actualEvent.status,
    });
  } else {
    LOGGER.warn("Subscription does not have an orgId in metadata", {
      input: actualEvent.metadata,
      zodParseError: parsedMetadata.error,
    });
  }

  LOGGER.info("Subscription updated", args);
};

export const handleSubUpdated = async (
  event: Stripe.CustomerSubscriptionUpdatedEvent,
) => {
  await handleSubEvent(event, "updated");
};

export const handleSubDeleted = async (
  event: Stripe.CustomerSubscriptionDeletedEvent,
) => {
  await handleSubEvent(event, "deleted");
};

/**
 * The metadata sent to the checkout session (annoyingly) wont be attached to
 * the subscription events, so we use this event to set these properties which we can
 * then use later
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

  const org = await fetchOrganizationById(metadata.data.orgId);

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
    customerId: actualEvent.customer,
    subId: actualEvent.subscription,
    orgId: org.orgId,
  });

  const metadataUpdate: StripeCheckoutCreatedMetadata = {
    userId: metadata.data.userId?.toString(),
    orgId: org.orgId,
  };

  // Update the Stripe subscription's metadata so future webhook events include orgId
  await StripeClient.subscriptions.update(actualEvent.subscription, {
    metadata: metadataUpdate,
  });

  // Update the organization with the new info for quicker access
  await updateOrganization({
    orgId: org.orgId,
    customerId: actualEvent.customer,
    stripeSubStatus: newSub.data.status,
  });
};
