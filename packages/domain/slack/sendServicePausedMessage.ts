import { Logger } from "../logging";
import type { SlackClient } from "./SlackClient";

const LOGGER = new Logger("domain.slack.sendServicePausedMessage");

/**
 * Sends a message to Slack indicating that notifications are paused due to payment
 * issues.
 *
 * This message is sent once when the 7-day grace period expires, and includes:
 * - A red warning color indicating service interruption
 * - A message explaining that notifications are paused
 * - A link to update billing information
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
  const billingUrl = `${frontendUrl}/app/org/${orgId}?page=billing`;

  try {
    const response = await slackClient.postMessage({
      message: {
        text: "🚫 Slack Notifications Paused",
        attachments: [
          {
            color: "#DC3545",
            text:
              `Your Slack notifications have been paused due to payment issues. ` +
              `Please update your payment method <${billingUrl}|here> to resume ` +
              `receiving PR notifications.`,
          },
        ],
      },
      threadTs: undefined,
    });

    if (!response) {
      LOGGER.error(
        "Failed to send service paused message - no response received",
        { orgId },
      );
      return false;
    }

    LOGGER.info("Successfully sent service paused message", { orgId });
    return true;
  } catch (error) {
    LOGGER.error("Error sending service paused message", { error, orgId });
    return false;
  }
}
