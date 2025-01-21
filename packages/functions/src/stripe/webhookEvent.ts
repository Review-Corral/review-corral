import { Logger } from "@domain/logging";
import { StripeClient } from "@domain/stripe/Stripe";
import { handleSessionCompleted, handleSubUpdated } from "@domain/stripe/handleEvent";
import { ApiHandler } from "@src/apiHandler";
import { Resource } from "sst";

const LOGGER = new Logger("stripe.webhook");

export const handler = ApiHandler(async (event, _context) => {
  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "No body provided",
      }),
    };
  }

  const webhookSignature = event.headers["stripe-signature"];

  if (!webhookSignature) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "No stripe-signature provided",
      }),
    };
  }

  const stripeEvent = StripeClient.webhooks.constructEvent(
    event.body,
    webhookSignature,
    Resource.STRIPE_WEBHOOK_SECRET.value,
  );

  switch (stripeEvent.type) {
    case "customer.subscription.created":
      // Don't do anything on this event, since the "subscription updated" event will
      // soon fire if the subscription is successful (active) which means that there
      // could be a race condition in inserting this into the database.
      LOGGER.info("🚀 Subscription created; doing nothing", {
        stripeEvent,
      });
      break;
    case "customer.subscription.updated":
      handleSubUpdated(stripeEvent);
      break;
    case "checkout.session.completed":
      handleSessionCompleted(stripeEvent);
      break;
    default:
      LOGGER.warn(
        `🤷‍♀️ Unhandled Stripe event type: ${stripeEvent.type}`,
        { stripeEvent },
        { depth: 5 },
      );
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Handled event",
    }),
  };
});
