import { Logger } from "@domain/logging";
import { ApiHandler } from "sst/node/api";
import Stripe from "stripe";
import { assertVarExists } from "../../core/utils/assert";

const LOGGER = new Logger("stripe.webhook");

const stripe = new Stripe(assertVarExists("STRIPE_SECRET_KEY"));

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

  const stripeEvent = stripe.webhooks.constructEvent(
    event.body,
    webhookSignature,
    assertVarExists("STRIPE_WEBHOOK_SECRET"),
  );

  // Cast event data to Stripe object
  if (stripeEvent.type === "payment_intent.succeeded") {
    const stripeObject: Stripe.PaymentIntent = stripeEvent.data
      .object as Stripe.PaymentIntent;
    LOGGER.info(`💰 PaymentIntent status: ${stripeObject.status}`);
  } else if (stripeEvent.type === "charge.succeeded") {
    const charge = stripeEvent.data.object as Stripe.Charge;
    LOGGER.info(`💵 Charge id: ${charge.id}`);
  } else {
    LOGGER.warn(`🤷‍♀️ Unhandled event type: ${stripeEvent.type}`);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Hello World",
      input: event,
    }),
  };
});
