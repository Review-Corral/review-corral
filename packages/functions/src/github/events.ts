import { assertVarExists } from "@core/utils/assert";
import {
  githubWebhookBodySchema,
  handleGithubWebhookEvent,
} from "@domain/github/webhooks";
import { verifyGithubWebhookSecret } from "@domain/github/webhooks/verifyEvent";
import { Logger } from "@domain/logging";
import { WebhookEvent } from "@octokit/webhooks-types";
import { APIGatewayProxyEventV2 } from "aws-lambda";
import { ApiHandler } from "sst/node/api";
import * as z from "zod";

const LOGGER = new Logger("functions.github.events");

const githubWebhookEventSchema = z
  .object({
    headers: z.object({
      "x-github-delivery": z.string(),
      "x-github-event": z.string(),
    }),
    body: z.string(),
  })
  .passthrough();

export type GithubWebhookEventPayload = z.infer<typeof githubWebhookEventSchema>;

export const handler = ApiHandler(async (event, context) => {
  LOGGER.debug(
    "Recieved Github event",
    {
      event,
    },
    { depth: 3 },
  );
  if (!(await checkEventWrapper(event))) {
    LOGGER.debug("Event didn't pass check", { event });
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized" }),
    };
  } else {
    const expectedEvent = githubWebhookEventSchema.safeParse(event);

    if (!expectedEvent.success) {
      LOGGER.debug("Invalid event", { event, parsedResult: expectedEvent });
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid event" }),
      };
    }

    const parsedBody = JSON.parse(expectedEvent.data.body);

    LOGGER.debug("Parsed event body as JSON", { parsedBody }, { depth: 3 });

    const expectedBody = githubWebhookBodySchema.safeParse(parsedBody);

    if (!expectedBody.success) {
      LOGGER.debug(
        "Recieved unexpected structure to event",
        {
          parsedResult: expectedBody,
          error: expectedBody.error,
        },
        {
          depth: 4,
        },
      );
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid event body" }),
      };
    }

    await handleGithubWebhookEvent({
      event: expectedBody.data,
      eventName: expectedEvent.data.headers["x-github-event"],
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Success" }),
    };
  }
});

export const isWebhookEvent = (event: any): event is WebhookEvent => {
  // Implement runtime checks based on the expected structure of WebhookEvent
  // This can be tricky since WebhookEvent may have a complex and varied structure
  if (
    event &&
    typeof event === "object" &&
    "action" in event &&
    "repository" in event
  ) {
    // Add more checks as necessary to validate the structure
    return true;
  }
  return false;
};

/**
 * Verifies the signature of the Github webhook event to ensure it came from Github.
 */
const checkEventWrapper = async (event: APIGatewayProxyEventV2) => {
  const webhookSecret = assertVarExists("GH_WEBHOOK_SECRET");

  try {
    const signature = event.headers["x-hub-signature-256"];

    if (!signature) {
      LOGGER.debug("No signature found", { headers: event.headers });
      return false;
    }

    if (Array.isArray(signature)) {
      LOGGER.debug("Signature is invalid type--expected array", {
        signature,
        signatureType: typeof signature,
      });
      return false;
    }

    return await verifyGithubWebhookSecret({
      eventBody: event.body,
      signature,
      secret: webhookSecret,
    });
  } catch (error) {
    console.error("Error checking event signature", { error });
    return false;
  }
};
