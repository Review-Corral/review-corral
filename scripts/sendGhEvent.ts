import { PullRequestEvent } from "@octokit/webhooks-types";
import * as crypto from "crypto";
import fetch from "node-fetch";
require("dotenv").config({ path: `.env.local` });

/**
 * Sends a simulated GitHub webhook event to an API.
 *
 * @param secret The shared secret used for signing the payload.
 * @param endpoint The API endpoint where the webhook event is sent.
 * @param payload The payload to send in the webhook event.
 */
async function sendGitHubWebhookEvent(
  secret: string,
  endpoint: string,
  payload: object,
): Promise<void> {
  // Convert the payload to a JSON string
  const payloadString = JSON.stringify(payload);

  // Create the HMAC SHA256 signature
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payloadString)
    .digest("hex");

  // Send the POST request with the signed payload
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-github-event": "pull_request", // Change as needed
      "X-Hub-Signature-256": `sha256=${signature}`,
    },
    body: payloadString,
  });

  // Check the response status
  if (!response.ok) {
    console.error(
      `Failed to send webhook event: ${response.status} - ${response.statusText}`,
    );
  } else {
    console.log("Webhook event sent successfully");
  }
}

// Example usage
const secret = process.env.GH_WEBHOOK_SECRET;
const endpoint = "https://alex-api.review-corral.com/gh/webhook-event";
const payload: PullRequestEvent = {
  action: "opened",
  pull_request: {
    id: 1,
    number: 1,
    title: "test",
    body: "test",
    html_url: "test",
    user: {
      login: "test",
      id: 1234,
    } as any,
    base: {
      repo: {
        name: "test",
        owner: {
          login: "test",
          id: 1234,
          node_id: "test",
          avatar_url: "test",
        },
      },
    },
  },
} as any as PullRequestEvent;

if (!secret) {
  throw new Error("GH_WEBHOOK_SECRET environment variable is not set");
}

sendGitHubWebhookEvent(secret, endpoint, payload).catch((error) =>
  console.error("Error sending webhook event:", error),
);
