import {
  StripeCheckoutCreatedMetadata,
  createCheckoutSessionBodySchema,
} from "@core/stripe/types";
import { fetchOrganizationById } from "@domain/dynamodb/fetchers/organizations";
import { Logger } from "@domain/logging";
import { StripeClient } from "@domain/stripe/Stripe";
import { useUser } from "src/utils/useUser";
import { ApiHandler } from "sst/node/api";

const LOGGER = new Logger("stripe.checkoutSession");

export const handler = ApiHandler(async (event, context) => {
  const { user, error } = await useUser();

  if (!user) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        message: "Unauthorized",
      }),
    };
  }

  const body = createCheckoutSessionBodySchema.safeParse(event.body);

  if (!body.success) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Invalid request body",
      }),
    };
  }

  const organization = await fetchOrganizationById(body.data.orgId);

  if (!organization) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        message: "Organization not found",
      }),
    };
  }

  const metaData: StripeCheckoutCreatedMetadata = {
    userId: user.userId,
    orgId: body.data.orgId,
  };

  const session = await StripeClient.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price: body.data.priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    metadata: metaData,
    // TODO:
    success_url: "https://example.com/success",
    cancel_url: "https://example.com/cancel",
  });

  if (!session.url) {
    LOGGER.error("Failed to create session URL", { session, user, body }, { depth: 4 });
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to create session",
      }),
    };
  }

  return {
    statusCode: 302,
    headers: {
      Location: session.url,
    },
  };
});
