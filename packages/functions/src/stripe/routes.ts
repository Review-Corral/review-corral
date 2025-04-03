import {
  StripeCheckoutCreatedMetadata,
  createBillingPortalSessionSchema,
  createCheckoutSessionBodySchema,
} from "@core/stripe/types";
import { assertVarExists } from "@core/utils/assert";
import {
  fetchOrganizationById,
  updateOrganization,
} from "@domain/dynamodb/fetchers/organizations";
import { Logger } from "@domain/logging";
import { StripeClient } from "@domain/stripe/Stripe";
import { handleSessionCompleted, handleSubUpdated } from "@domain/stripe/handleEvent";
import { Hono } from "hono";
import { Resource } from "sst";
import { authMiddleware, requireAuth } from "../middleware/auth";

const LOGGER = new Logger("stripe:routes");

export const app = new Hono();

// Create a group for authenticated routes
const authRoutes = new Hono();

// Apply authentication middleware to authenticated routes
authRoutes.use("*", authMiddleware, requireAuth);

// Checkout session route
authRoutes.post("/checkout-session", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  try {
    const body = await c.req.json();
    const parsedBody = createCheckoutSessionBodySchema.safeParse(body);

    if (!parsedBody.success) {
      LOGGER.error("Invalid request body", { body, error: parsedBody.error });
      return c.json({ message: "Invalid request body" }, 400);
    }

    const organization = await fetchOrganizationById(parsedBody.data.orgId);

    if (!organization) {
      return c.json({ message: "Organization not found" }, 404);
    }

    let customerId: string;

    if (!organization.customerId) {
      const customer = await StripeClient.customers.create({
        email: organization.billingEmail,
        name: organization.name,
        metadata: {
          userId: user.userId,
          orgId: parsedBody.data.orgId,
        },
      });

      await updateOrganization({
        orgId: parsedBody.data.orgId,
        customerId: customer.id,
      });

      customerId = customer.id;
    } else {
      customerId = organization.customerId;
    }

    const metaData: StripeCheckoutCreatedMetadata = {
      userId: user.userId,
      orgId: parsedBody.data.orgId,
    };

    const frontendUrl = assertVarExists("BASE_FE_URL");

    LOGGER.info("frontendUrl", { frontendUrl });

    const session = await StripeClient.checkout.sessions.create({
      payment_method_types: ["card"],
      customer: customerId,
      line_items: [
        {
          price: parsedBody.data.priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      metadata: metaData,
      customer_email: organization.billingEmail,
      success_url: `${frontendUrl}/app/org/${parsedBody.data.orgId}/payment/success`,
      cancel_url: `${frontendUrl}/app/org/${parsedBody.data.orgId}/payment/failure`,
    });

    if (!session.url) {
      LOGGER.error(
        "Failed to create session URL",
        { session, user, body },
        { depth: 4 },
      );
      return c.json({ message: "Failed to create session" }, 500);
    }

    LOGGER.info("Returning session URL", { url: session.url });

    return c.json({ url: session.url });
  } catch (error) {
    LOGGER.error("Error creating checkout session", { error });
    return c.json({ message: "Error creating checkout session" }, 500);
  }
});

// Billing portal session route
authRoutes.post("/billing-portal", async (c) => {
  const user = c.get("user");

  try {
    const body = await c.req.json();
    const parsedBody = createBillingPortalSessionSchema.safeParse(body);

    if (!parsedBody.success) {
      LOGGER.error("Invalid request body", { body, error: parsedBody.error });
      return c.json({ message: "Invalid request body" }, 400);
    }

    const frontendUrl = assertVarExists("BASE_FE_URL");

    const session = await StripeClient.billingPortal.sessions.create({
      customer: parsedBody.data.customerId,
      return_url: `${frontendUrl}/org/${parsedBody.data.orgId}/billing`,
    });

    if (!session.url) {
      LOGGER.error(
        "Failed to create session URL",
        { session, user, body },
        { depth: 4 },
      );
      return c.json({ message: "Failed to create session" }, 500);
    }

    LOGGER.info("Returning session URL", { url: session.url });

    return c.json({ url: session.url });
  } catch (error) {
    LOGGER.error("Error creating billing portal session", { error });
    return c.json({ message: "Error creating billing portal session" }, 500);
  }
});

// Webhook event route - no auth required
app.post("/webhook-event", async (c) => {
  try {
    const body = await c.req.text();

    if (!body) {
      return c.json({ message: "No body provided" }, 400);
    }

    const webhookSignature = c.req.header("stripe-signature");

    if (!webhookSignature) {
      return c.json({ message: "No stripe-signature provided" }, 400);
    }

    const stripeEvent = StripeClient.webhooks.constructEvent(
      body,
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
          `🤷 Unhandled Stripe event type: ${stripeEvent.type}`,
          { stripeEvent },
          { depth: 5 },
        );
    }

    return c.json({ message: "Handled event" });
  } catch (error) {
    LOGGER.error("Error handling webhook event", { error });
    return c.json({ message: "Error handling webhook event" }, 500);
  }
});

// Merge the authenticated routes into main app
app.route("/", authRoutes);
