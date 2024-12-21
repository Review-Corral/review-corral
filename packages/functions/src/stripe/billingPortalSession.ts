import { createBillingPortalSessionSchema } from "@core/stripe/types";
import { assertVarExists } from "@core/utils/assert";
import {} from "@domain/dynamodb/fetchers/organizations";
import { Logger } from "@domain/logging";
import { StripeClient } from "@domain/stripe/Stripe";
import ApiHandler from "src/handler";
import { useUser } from "src/utils/useUser";

const LOGGER = new Logger("stripe.billingPortalSession");

export const handler = ApiHandler(async (event, _context) => {
  const { user, error: _error } = await useUser();

  LOGGER.info("Creating billing protal session", { body: event.body });

  if (!user) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        message: "Unauthorized",
      }),
    };
  }

  const body = createBillingPortalSessionSchema.safeParse(JSON.parse(event.body ?? ""));

  if (!body.success) {
    LOGGER.error("Invalid request body", { body: event.body, error: body.error });
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Invalid request body",
      }),
    };
  }

  const frontendUrl = assertVarExists("BASE_FE_URL");

  const session = await StripeClient.billingPortal.sessions.create({
    customer: body.data.customerId,
    return_url: `${frontendUrl}/org/${body.data.orgId}/billing`,
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
