import {
  StripeCheckoutCreatedMetadata,
  createCheckoutSessionBodySchema,
} from "@core/stripe/types";
import { assertVarExists } from "@core/utils/assert";
import {
  fetchOrganizationById,
  updateOrganization,
} from "@domain/dynamodb/fetchers/organizations";
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

  const body = createCheckoutSessionBodySchema.safeParse(JSON.parse(event.body ?? ""));

  if (!body.success) {
    LOGGER.error("Invalid request body", { body: event.body, error: body.error });
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

  let customerId: string;

  if (!organization.customerId) {
    const customer = await StripeClient.customers.create({
      email: organization.billingEmail,
      name: organization.name,
      metadata: {
        userId: user.userId,
        orgId: body.data.orgId,
      },
    });

    await updateOrganization({
      orgId: body.data.orgId,
      customerId: customer.id,
    });

    customerId = customer.id;
  } else {
    customerId = organization.customerId;
  }

  const metaData: StripeCheckoutCreatedMetadata = {
    userId: user.userId,
    orgId: body.data.orgId,
  };

  const frontendUrl = assertVarExists("BASE_FE_URL");

  LOGGER.info("frontendUrl", { frontendUrl });

  const session = await StripeClient.checkout.sessions.create({
    payment_method_types: ["card"],
    customer: customerId,
    line_items: [
      {
        price: body.data.priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    metadata: metaData,
    customer_email: organization.billingEmail,
    success_url: `${frontendUrl}/org/${body.data.orgId}/payment/success`,
    cancel_url: `${frontendUrl}/org/${body.data.orgId}/payment/failure`,
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

  LOGGER.info("Returning session URL", { url: session.url });

  return {
    statusCode: 200,
    body: JSON.stringify({
      url: session.url,
    }),
  };
});
