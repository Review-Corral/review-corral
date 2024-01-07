import { WebhookEvent } from "@octokit/webhooks-types";
import { APIGatewayProxyEventV2 } from "aws-lambda";
import { createHmac } from "crypto";
import { ApiHandler } from "sst/node/api";
import * as z from "zod";
import {
  githubWebhookBodySchema,
  handleGithubWebhookEvent,
} from "../../../core/github/webhooks";
import { Logger } from "../../../core/logging";

const LOGGER = new Logger("functions.github.events");

const githubWebhookEventSchema = z.object({
  headers: z.object({
    "x-github-delivery": z.string(),
    "x-github-event": z.string(),
  }),
  body: z.string(),
});

export type GithubWebhookEventPayload = z.infer<
  typeof githubWebhookEventSchema
>;

export const handler = ApiHandler(async (event, context) => {
  if (!(await checkEventWrapper(event))) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized" }),
    };
  } else {
    const parsedEvent = githubWebhookEventSchema.safeParse(event);

    if (!parsedEvent.success) {
      LOGGER.debug("Invalid event", { event, parsedResult: parsedEvent });
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid event" }),
      };
    }

    const parsedBody = githubWebhookBodySchema.safeParse(parsedEvent.data.body);

    if (!parsedBody.success) {
      LOGGER.debug("Recieved unexpected structure to event", {
        parsedResult: parsedBody,
        event,
      });
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid event" }),
      };
    }

    await handleGithubWebhookEvent({
      event: parsedBody.data,
      eventName: parsedEvent.data.headers["x-github-event"],
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
  if (!process.env.GITHUB_WEBHOOK_SECRET) {
    console.error("No GITHUB_WEBHOOK_SECRET set");
    return false;
  }
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
      event,
      signature,
      secret: process.env.GITHUB_WEBHOOK_SECRET,
    });
  } catch (error) {
    console.error("Error checking event signature", { error });
    return false;
  }
};

const verifyGithubWebhookSecret = async ({
  event,
  signature,
  secret,
}: {
  event: APIGatewayProxyEventV2;
  signature: string;
  secret: string;
}) => {
  const hmac = createHmac("sha256", secret);
  hmac.update(JSON.stringify(event.body));
  const calculated = `sha256=${hmac.digest("hex")}`;

  return calculated === signature;
};
