import { fetchOrganizationById } from "@domain/dynamodb/fetchers/organizations";
import { Logger } from "@domain/logging";
import { StripeClient } from "@domain/stripe/Stripe";
import { useUser } from "src/utils/useUser";
import { ApiHandler } from "sst/node/api";
import z from "zod";

const LOGGER = new Logger("stripe.checkoutSession");

const bodySchema = z.object({
  orgId: z.number(),
  priceId: z
    .literal("price_1P9FpDBqa9UplzHeeJ57VHoc") // test price
    .or(z.literal("price_1P8CmKBqa9UplzHebShipTnE")), // prod price,
});

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

  const body = bodySchema.safeParse(event.body);

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

  const session = await StripeClient.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price: body.data.priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    metadata: {
      user_id: user.userId,
      customer_id: body.data.orgId,
    },
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
