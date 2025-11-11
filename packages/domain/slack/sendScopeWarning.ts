import { Logger } from "../logging";
import type { SlackClient } from "./SlackClient";

const LOGGER = new Logger("domain.slack.sendScopeWarning");

/**
 * Sends a warning message to the configured Slack channel about outdated OAuth
 * scopes.
 *
 * The message includes:
 * - A warning emoji and header text
 * - A yellow-colored attachment with a link to update the integration
 *
 * @param slackClient - The SlackClient instance to use for sending the message
 * @param orgId - The organization ID to use in the update link
 * @param frontendUrl - The base URL of the frontend application
 * @returns true if the message was sent successfully, false otherwise
 */
export async function sendScopeWarning(
  slackClient: SlackClient,
  orgId: number,
  frontendUrl: string,
): Promise<boolean> {
  const updateUrl = `${frontendUrl}/app/org/${orgId}?page=overview`;

  try {
    const response = await slackClient.postMessage({
      message: {
        text: "⚠️ WARN: OAuth Scopes Update required",
        attachments: [
          {
            color: "#FFD700", // Yellow/gold warning color
            text: `Your Slack Integration scopes are out of date, please update them <${updateUrl}|here>`,
          },
        ],
      },
      threadTs: undefined,
    });

    if (!response) {
      LOGGER.error("Failed to send scope warning message - no response received");
      return false;
    }

    LOGGER.info("Successfully sent scope warning message", { orgId });
    return true;
  } catch (error) {
    LOGGER.error("Error sending scope warning message", { error, orgId });
    return false;
  }
}
