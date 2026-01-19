import type { MessageAttachment } from "@slack/web-api";
import { Logger } from "../logging";
import type { SlackClient } from "./SlackClient";

const LOGGER = new Logger("domain.slack.sendServicePausedMessage");

export type ServicePausedMessage = {
  text: string;
  attachments: MessageAttachment[];
};

/**
 * Builds the service paused message content.
 */
export function buildServicePausedMessage(
  orgId: number,
  frontendUrl: string,
): ServicePausedMessage {
  const billingUrl = `${frontendUrl}/app/org/${orgId}?page=billing`;

  return {
    text: "🚫 Slack Notifications Paused",
    attachments: [
      {
        color: "#DC3545",
        text: `Your Slack notifications have been paused due to payment issues. Please update your payment method <${billingUrl}|here> to resume receiving PR notifications.`,
      },
    ],
  };
}

/**
 * Sends a message to Slack indicating that notifications are paused due to payment
 * issues.
 *
 * @param slackClient - The SlackClient instance to use for sending the message
 * @param orgId - The organization ID to use in the billing link
 * @param frontendUrl - The base URL of the frontend application
 * @returns true if the message was sent successfully, false otherwise
 */
export async function sendServicePausedMessage(
  slackClient: SlackClient,
  orgId: number,
  frontendUrl: string,
): Promise<boolean> {
  const message = buildServicePausedMessage(orgId, frontendUrl);

  try {
    const response = await slackClient.postMessage({
      message,
      threadTs: undefined,
    });

    if (!response) {
      LOGGER.error("Failed to send service paused message - no response received", {
        orgId,
      });
      return false;
    }

    LOGGER.info("Successfully sent service paused message", { orgId });
    return true;
  } catch (error) {
    LOGGER.error("Error sending service paused message", { error, orgId });
    return false;
  }
}
