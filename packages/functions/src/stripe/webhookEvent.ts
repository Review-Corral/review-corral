import { assertVarExists } from "@core/utils/assert";
import { Logger } from "@domain/logging";
import { StripeClient } from "@domain/stripe/Stripe";
import { handleSubCreated } from "@domain/stripe/handlePayment";
import { ApiHandler } from "sst/node/api";
import Stripe from "stripe";

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

  if (stripeEvent.type === "checkout.session.completed") {
    const subscription = stripeEvent.data.object as Stripe.Checkout.Session;
    await handleSubCreated(subscription);
  } else if (stripeEvent.type === "payment_intent.succeeded") {
    const stripeObject: Stripe.PaymentIntent = stripeEvent.data
      .object as Stripe.PaymentIntent;
    LOGGER.info(`💰 PaymentIntent status: ${stripeObject.status}`, { stripeObject });
  } else if (stripeEvent.type === "charge.succeeded") {
    const charge = stripeEvent.data.object as Stripe.Charge;
    LOGGER.info(`💵 Charge id: ${charge.id}`, { charge });
  } else {
    LOGGER.warn(
      `🤷‍♀️ Unhandled event type: ${stripeEvent.type}`,
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
