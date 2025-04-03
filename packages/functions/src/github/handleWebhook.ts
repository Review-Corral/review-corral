import { githubWebhookBodySchema } from "@domain/github/webhooks";
import { verifyGithubWebhookSecret } from "@domain/github/webhooks/verifyEvent";
import { Logger } from "@domain/logging";
import { APIGatewayEvent } from "aws-lambda";
import { Handler } from "hono/types";
import { Resource } from "sst";
import { z } from "zod";

const LOGGER = new Logger("github:routes:handleWebhook");

export type Bindings = {
  event: APIGatewayEvent;
};

// Schema definitions
const githubWebhookEventSchema = z
  .object({
    headers: z.object({
      "x-github-delivery": z.string(),
      "x-github-event": z.string(),
    }),
    body: z.string(),
  })
  .passthrough();

export const handleGithubWebhookEvent: Handler<{
  Bindings: Bindings;
}> = async (c) => {
  const event = c.env.event;
  LOGGER.debug("Received Github event", { event }, { depth: 3 });

  // Verify webhook signature
  try {
    const webhookSecret = Resource.GH_WEBHOOK_SECRET.value;
    const signature = c.req.header("x-hub-signature-256");

    if (!signature) {
      return c.json({ message: "Unauthorized" }, 401);
    }

    if (Array.isArray(signature)) {
      LOGGER.debug("Signature is invalid type--expected array", {
        signature,
        signatureType: typeof signature,
      });
      return c.json({ message: "Unauthorized" }, 401);
    }

    const verified = await verifyGithubWebhookSecret({
      eventBody: c.req.json(),
      signature,
      secret: webhookSecret,
    });

    if (!verified) {
      return c.json({ message: "Unauthorized" }, 401);
    }
  } catch (error) {
    LOGGER.error("Error checking event signature", { error });
    return c.json({ message: "Unauthorized" }, 401);
  }

  // Parse and validate event
  const expectedEvent = githubWebhookEventSchema.safeParse(event);

  if (!expectedEvent.success) {
    LOGGER.debug("Invalid event", { event, parsedResult: expectedEvent });
    return c.json({ message: "Invalid event" }, 400);
  }

  const parsedBody = JSON.parse(expectedEvent.data.body);

  LOGGER.debug("Parsed event body as JSON", { parsedBody }, { depth: 3 });

  const expectedBody = githubWebhookBodySchema.safeParse(parsedBody);

  if (!expectedBody.success) {
    LOGGER.debug(
      "Received unexpected structure to event",
      {
        parsedResult: expectedBody,
        error: expectedBody.error,
      },
      {
        depth: 4,
      },
    );
    return c.json({ message: "Invalid event body" }, 400);
  }

  return c.json({ message: "Success" }, 200);
};
