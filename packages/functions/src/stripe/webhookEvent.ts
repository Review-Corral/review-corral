import { Logger } from "@domain/logging";
import { ApiHandler } from "sst/node/api";
import Stripe from "stripe";
import { assertVarExists } from "../../../core/utils/assert";

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

  if (stripeEvent.type === "customer.subscription.created") {
    const subscription = stripeEvent.data.object as Stripe.Subscription;
    LOGGER.info(`🚀 Subscription created: ${subscription.id}`, { subscription });
  } else if (stripeEvent.type === "payment_intent.succeeded") {
    const stripeObject: Stripe.PaymentIntent = stripeEvent.data
      .object as Stripe.PaymentIntent;
    LOGGER.info(`💰 PaymentIntent status: ${stripeObject.status}`, { stripeObject });
  } else if (stripeEvent.type === "charge.succeeded") {
    const charge = stripeEvent.data.object as Stripe.Charge;
    LOGGER.info(`💵 Charge id: ${charge.id}`, { charge });
  } else {
    LOGGER.warn(`🤷‍♀️ Unhandled event type: ${stripeEvent.type}`, { stripeEvent });
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Handled event",
    }),
  };
});
