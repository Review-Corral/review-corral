import { Organization } from "@core/dynamodb/entities/types";
import {
  StripeCheckoutCreatedMetadata,
  createCheckoutSessionBodySchema,
} from "@core/stripe/types";
import { assertVarExists } from "@core/utils/assert";
import {
  fetchOrganizationById,
  updateOrgCustomerId,
} from "@domain/dynamodb/fetchers/organizations";
import { Logger } from "@domain/logging";
import { StripeClient } from "@domain/stripe/Stripe";
import { useUser } from "src/utils/useUser";
import { ApiHandler } from "sst/node/api";

const LOGGER = new Logger("stripe.checkoutSession");

const getOrCreateCustomer = async (organization: Organization): Promise<string> => {
  if (organization.customerId) return organization.customerId;

  LOGGER.info("Organization does not have a customerId; will attempt to create one", {
    organization,
  });

  if (!organization.billingEmail) {
    throw new Error("Organization does not have a billing email");
  }

  const result = await StripeClient.customers.create({
    email: organization.billingEmail,
    metadata: {
      orgId: organization.orgId,
    },
  });

  await updateOrgCustomerId({
    customerId: result.id,
    orgId: organization.orgId,
  });

  return result.id;
};

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
  try {
    customerId = await getOrCreateCustomer(organization);
  } catch (e) {
    LOGGER.error("Failed to create customer", { orgId: organization.orgId, error: e });
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to create customer",
      }),
    };
  }

  const metaData: StripeCheckoutCreatedMetadata = {
    userId: user.userId,
    orgId: body.data.orgId,
  };

  const frontendUrl = assertVarExists("BASE_FE_URL");

  LOGGER.info("frontendUrl", { frontendUrl });

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
    customer: customerId,
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
