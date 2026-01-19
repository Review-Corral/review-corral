import type { MessageAttachment } from "@slack/web-api";
import { Logger } from "../logging";
import type { SlackClient } from "./SlackClient";

const LOGGER = new Logger("domain.slack.sendPaymentWarning");

export type PaymentWarningMessage = {
  text: string;
  attachments: MessageAttachment[];
};

/**
 * Builds the payment warning message content.
 */
export function buildPaymentWarningMessage(
  orgId: number,
  frontendUrl: string,
  daysRemaining: number,
): PaymentWarningMessage {
  const billingUrl = `${frontendUrl}/app/org/${orgId}?page=billing`;

  return {
    text: "⚠️ WARN: Payment Issue Detected",
    attachments: [
      {
        color: "#FFD700",
        text: `Your payment method needs to be updated. You have *${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}* remaining before Slack notifications are paused. Please update your billing information <${billingUrl}|here>.`,
      },
    ],
  };
}

/**
 * Sends a warning message to the configured Slack channel about payment issues.
 *
 * @param slackClient - The SlackClient instance to use for sending the message
 * @param orgId - The organization ID to use in the billing link
 * @param frontendUrl - The base URL of the frontend application
 * @param daysRemaining - Number of days remaining in the grace period
 * @returns true if the message was sent successfully, false otherwise
 */
export async function sendPaymentWarning(
  slackClient: SlackClient,
  orgId: number,
  frontendUrl: string,
  daysRemaining: number,
): Promise<boolean> {
  const message = buildPaymentWarningMessage(orgId, frontendUrl, daysRemaining);

  try {
    const response = await slackClient.postMessage({
      message,
      threadTs: undefined,
    });

    if (!response) {
      LOGGER.error("Failed to send payment warning message - no response received");
      return false;
    }

    LOGGER.info("Successfully sent payment warning message", { orgId, daysRemaining });
    return true;
  } catch (error) {
    LOGGER.error("Error sending payment warning message", { error, orgId });
    return false;
  }
}
