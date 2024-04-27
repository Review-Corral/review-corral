import { assertVarExists } from "@core/utils/assert";
import { Logger } from "@domain/logging";
import { StripeClient } from "@domain/stripe/Stripe";
import { handleSubCreated, handleSubUpdated } from "@domain/stripe/handleEvent";
import { ApiHandler } from "sst/node/api";

const LOGGER = new Logger("stripe.webhook");

export const handler = ApiHandler(async (event, context) => {
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
    assertVarExists("STRIPE_WEBHOOK_SECRET"),
  );

  switch (stripeEvent.type) {
    case "customer.subscription.created":
      handleSubCreated(stripeEvent);
      break;
    case "customer.subscription.updated":
      handleSubUpdated(stripeEvent);
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
